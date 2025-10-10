import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import tagMappingData from '../../config/tag_mapping.json';

export function Scene3D({ selectedProcessId, onTagSelect }) {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const frameRef = useRef(0);
  const tagsRef = useRef(new Map());
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const isDraggingRef = useRef(false);
  const selectedTagRef = useRef(null);
  const modelRef = useRef(null);
  const dragTooltipRef = useRef(null);

  const [status, setStatus] = useState('Loading Three.js…');
  const [error, setError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [tags, setTags] = useState(tagMappingData.tags || []);
  const [draggedTagName, setDraggedTagName] = useState('');
  const [snapToGrid, setSnapToGrid] = useState(false);

  const backend = useMemo(() => (import.meta?.env?.REACT_APP_BACKEND_URL ?? process.env.REACT_APP_BACKEND_URL ?? ''), []);
  const glbUrl = useMemo(() => {
    // Aggressive cache busting - use both timestamp and random value
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return backend.replace(/\/$/, '') + '/api/assets/dmr.glb?cb=' + timestamp + '&r=' + random;
  }, [backend]);

  // Create interactive tag
  const createTag = useCallback((tagData) => {
    const group = new THREE.Group();
    group.userData = { ...tagData, isTag: true };

    // Tag background (rounded rectangle)
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 200;
    canvas.height = 60;
    
    // Draw rounded rectangle background
    context.fillStyle = 'rgba(13, 15, 18, 0.9)';
    context.strokeStyle = tagData.color || '#22c55e';
    context.lineWidth = 2;
    
    const x = 10, y = 10, width = 180, height = 40, radius = 8;
    context.beginPath();
    context.moveTo(x + radius, y);
    context.lineTo(x + width - radius, y);
    context.quadraticCurveTo(x + width, y, x + width, y + radius);
    context.lineTo(x + width, y + height - radius);
    context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    context.lineTo(x + radius, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - radius);
    context.lineTo(x, y + radius);
    context.quadraticCurveTo(x, y, x + radius, y);
    context.closePath();
    context.fill();
    context.stroke();
    
    // Add text
    context.fillStyle = '#e5e7eb';
    context.font = 'bold 16px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(tagData.name, 100, 30);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    const material = new THREE.SpriteMaterial({ 
      map: texture,
      transparent: true,
      alphaTest: 0.1
    });
    
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.5, 0.15, 1);
    sprite.userData = { ...tagData, isTagSprite: true };
    
    group.add(sprite);
    group.position.set(tagData.position.x, tagData.position.y, tagData.position.z);
    
    return group;
  }, []);

  // Update tag highlight state
  const updateTagHighlight = useCallback((tagId, isHighlighted) => {
    const tagGroup = tagsRef.current.get(tagId);
    if (tagGroup) {
      const sprite = tagGroup.children[0];
      if (sprite && sprite.material) {
        if (isHighlighted) {
          sprite.material.color.setHex(0xffff00);
          sprite.scale.set(0.6, 0.18, 1);
        } else {
          sprite.material.color.setHex(0xffffff);
          sprite.scale.set(0.5, 0.15, 1);
        }
      }
    }
  }, []);

  // Handle mouse hover and drag
  const handleMouseMoveHover = useCallback((event) => {
    // Handle dragging if active
    if (isDraggingRef.current && selectedTagRef.current) {
      const rect = mountRef.current.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      
      // Update tooltip position first
      if (dragTooltipRef.current) {
        dragTooltipRef.current.style.left = `${event.clientX + 10}px`;
        dragTooltipRef.current.style.top = `${event.clientY - 10}px`;
      }
      
      let newPosition = null;
      
      // Try to raycast against the 3D model for surface snapping
      if (modelRef.current) {
        const modelIntersects = raycasterRef.current.intersectObject(modelRef.current, true);
        
        if (modelIntersects.length > 0) {
          // Snap to surface of the model
          const intersectionPoint = modelIntersects[0].point.clone();
          const normal = modelIntersects[0].face.normal.clone();
          
          // Apply grid snapping if enabled
          if (snapToGrid) {
            const gridSize = 0.25; // 25cm grid
            intersectionPoint.x = Math.round(intersectionPoint.x / gridSize) * gridSize;
            intersectionPoint.y = Math.round(intersectionPoint.y / gridSize) * gridSize;
            intersectionPoint.z = Math.round(intersectionPoint.z / gridSize) * gridSize;
          }
          
          // Offset slightly from surface to prevent z-fighting
          intersectionPoint.add(normal.multiplyScalar(0.1));
          newPosition = intersectionPoint;
        }
      }
      
      // Fallback: project onto a plane if no model intersection
      if (!newPosition) {
        const modelCenter = new THREE.Vector3();
        if (modelRef.current) {
          const box = new THREE.Box3().setFromObject(modelRef.current);
          box.getCenter(modelCenter);
        }
        
        const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -modelCenter.z);
        const intersection = new THREE.Vector3();
        raycasterRef.current.ray.intersectPlane(plane, intersection);
        
        if (intersection) {
          if (snapToGrid) {
            const gridSize = 0.25;
            intersection.x = Math.round(intersection.x / gridSize) * gridSize;
            intersection.y = Math.round(intersection.y / gridSize) * gridSize;
            intersection.z = Math.round(intersection.z / gridSize) * gridSize;
          }
          newPosition = intersection;
        }
      }
      
      // Update tag position
      if (newPosition && selectedTagRef.current) {
        selectedTagRef.current.position.copy(newPosition);
        console.log('Moving tag to:', newPosition.toArray());
      }
      
      // Change cursor while dragging
      mountRef.current.style.cursor = 'grabbing';
      return;
    }
    
    // Handle hover cursor changes when not dragging
    if (!sceneRef.current || !cameraRef.current) return;
    
    const rect = mountRef.current.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    
    // Get all tag objects (sprites inside groups)
    const tagObjects = Array.from(tagsRef.current.values()).map(group => group.children[0]).filter(Boolean);
    const intersects = raycasterRef.current.intersectObjects(tagObjects);
    
    if (intersects.length > 0 && isEditMode) {
      mountRef.current.style.cursor = 'grab';
    } else if (intersects.length > 0) {
      mountRef.current.style.cursor = 'pointer';
    } else {
      mountRef.current.style.cursor = 'default';
    }
  }, [isEditMode, snapToGrid]);
  const handleMouseDown = useCallback((event) => {
    if (!sceneRef.current || !cameraRef.current) return;
    
    const rect = mountRef.current.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    
    // Get all tag objects (sprites inside groups)
    const tagObjects = Array.from(tagsRef.current.values()).map(group => group.children[0]).filter(Boolean);
    const intersects = raycasterRef.current.intersectObjects(tagObjects);
    
    console.log('Mouse down - checking intersects:', intersects.length, 'Edit mode:', isEditMode);
    
    if (intersects.length > 0) {
      const selectedObject = intersects[0].object;
      const tagData = selectedObject.userData;
      
      console.log('Selected tag:', tagData.name, 'Edit mode:', isEditMode);
      
      if (isEditMode) {
        isDraggingRef.current = true;
        selectedTagRef.current = selectedObject.parent;
        setDraggedTagName(tagData.name);
        if (controlsRef.current) controlsRef.current.enabled = false;
        
        // Show drag tooltip
        if (dragTooltipRef.current) {
          dragTooltipRef.current.textContent = `Dragging: ${tagData.name}`;
          dragTooltipRef.current.style.display = 'block';
          dragTooltipRef.current.style.left = `${event.clientX + 10}px`;
          dragTooltipRef.current.style.top = `${event.clientY - 10}px`;
        }
        
        // Add dragging visual feedback
        selectedObject.material.color.setHex(0xff6b00); // Orange while dragging
        selectedObject.scale.set(0.7, 0.21, 1); // Larger while dragging
        
        console.log('Started dragging:', tagData.name);
      } else {
        // Select tag and notify Process Flow
        if (onTagSelect) {
          onTagSelect(tagData.processId);
        }
      }
    } else {
      console.log('No tag intersections found');
    }
  }, [isEditMode, onTagSelect]);

  const handleMouseMove = handleMouseMoveHover;

  const handleMouseUp = useCallback(() => {
    if (isDraggingRef.current && selectedTagRef.current) {
      // Save new position and restore visual state
      const tagData = selectedTagRef.current.userData;
      const newPosition = selectedTagRef.current.position;
      
      console.log(`Tag ${tagData.name} moved to:`, newPosition.toArray());
      
      // Update tags state
      setTags(prevTags => 
        prevTags.map(tag => 
          tag.id === tagData.id 
            ? { ...tag, position: { x: newPosition.x, y: newPosition.y, z: newPosition.z } }
            : tag
        )
      );
      
      // Restore normal appearance
      const sprite = selectedTagRef.current.children[0];
      if (sprite) {
        sprite.material.color.setHex(0xffffff);
        sprite.scale.set(0.5, 0.15, 1);
      }
    }
    
    isDraggingRef.current = false;
    selectedTagRef.current = null;
    setDraggedTagName('');
    
    // Hide drag tooltip
    if (dragTooltipRef.current) {
      dragTooltipRef.current.style.display = 'none';
    }
    
    if (controlsRef.current) {
      controlsRef.current.enabled = true;
    }
    
    console.log('Drag ended, controls re-enabled');
  }, []);

  // Save tags to localStorage and backend
  const saveTags = useCallback(async () => {
    const updatedTags = tags.map(tag => ({
      ...tag,
      position: tagsRef.current.has(tag.id) 
        ? {
            x: Number(tagsRef.current.get(tag.id).position.x.toFixed(3)),
            y: Number(tagsRef.current.get(tag.id).position.y.toFixed(3)),
            z: Number(tagsRef.current.get(tag.id).position.z.toFixed(3))
          }
        : tag.position
    }));

    const tagData = { tags: updatedTags };
    
    // Save to localStorage
    localStorage.setItem('dmr_tag_mapping', JSON.stringify(tagData));
    
    // TODO: Save to backend endpoint
    console.log('Tags saved:', tagData);
    
    // Visual feedback
    const saveButton = document.querySelector('.save-tags-button');
    if (saveButton) {
      const originalText = saveButton.textContent;
      saveButton.textContent = 'Saved!';
      saveButton.style.background = '#10b981';
      setTimeout(() => {
        saveButton.textContent = originalText;
        saveButton.style.background = 'rgba(34,197,94,0.8)';
      }, 1500);
    }
  }, [tags]);

  // Reset tags to default positions
  const resetTags = useCallback(() => {
    if (window.confirm('Are you sure you want to reset all tags to their default positions? This cannot be undone.')) {
      setTags(tagMappingData.tags);
      localStorage.removeItem('dmr_tag_mapping');
      
      // Update existing tags in scene
      tagMappingData.tags.forEach(tagData => {
        const tagGroup = tagsRef.current.get(tagData.id);
        if (tagGroup) {
          tagGroup.position.set(tagData.position.x, tagData.position.y, tagData.position.z);
        }
      });
      
      // Visual feedback
      const resetButton = document.querySelector('button:last-child');
      if (resetButton) {
        const originalText = resetButton.textContent;
        resetButton.textContent = '✓ Reset!';
        resetButton.style.background = 'rgba(34,197,94,0.8)';
        setTimeout(() => {
          resetButton.textContent = originalText;
          resetButton.style.background = 'rgba(239,68,68,0.8)';
        }, 1500);
      }
      
      console.log('Tags reset to default positions');
    }
  }, []);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Escape' && isDraggingRef.current) {
      // Cancel dragging on Escape
      if (selectedTagRef.current) {
        const sprite = selectedTagRef.current.children[0];
        if (sprite) {
          sprite.material.color.setHex(0xffffff);
          sprite.scale.set(0.5, 0.15, 1);  
        }
      }
      
      isDraggingRef.current = false;
      selectedTagRef.current = null;
      setDraggedTagName('');
      
      if (dragTooltipRef.current) {
        dragTooltipRef.current.style.display = 'none';
      }
      
      if (controlsRef.current) {
        controlsRef.current.enabled = true;
      }
    } else if (event.key === 'e' || event.key === 'E') {
      // Toggle edit mode with 'E' key
      if (!event.ctrlKey && !event.altKey && !event.shiftKey) {
        setIsEditMode(!isEditMode);
      }
    } else if (event.key === 's' || event.key === 'S') {
      // Save with 'S' key (if in edit mode)
      if (isEditMode && !event.ctrlKey && !event.altKey && !event.shiftKey) {
        event.preventDefault();
        saveTags();
      }
    }
  }, [isEditMode, saveTags]);

  // Add keyboard event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Load saved tags from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('smr_tag_mapping');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.tags) {
          setTags(data.tags);
          console.log('Loaded saved tag positions');
        }
      } catch (e) {
        console.error('Failed to load saved tags:', e);
      }
    }
  }, []);

  // Update tag highlights when selectedProcessId changes
  useEffect(() => {
    tagsRef.current.forEach((tagGroup, tagId) => {
      const tagData = tagGroup.userData;
      const isSelected = tagData.processId === selectedProcessId;
      updateTagHighlight(tagId, isSelected);
    });
  }, [selectedProcessId, updateTagHighlight]);

  useEffect(() => {
    let disposed = false;

    async function boot() {
      try {
        setStatus('Loading viewer…');
        if (disposed) return;

        // Scene with neutral background to match Meshy.ai rendering
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x2a2a2a); // Neutral dark gray
        sceneRef.current = scene;

        // Renderer optimized for accurate color display
        const mount = mountRef.current;
        const renderer = new THREE.WebGLRenderer({ 
          antialias: true, 
          alpha: false,
          preserveDrawingBuffer: true
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.5; // Higher exposure to match Meshy brightness
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.physicallyCorrectLights = true;
        rendererRef.current = renderer;
        mount.appendChild(renderer.domElement);

        // Camera
        const { clientWidth: w, clientHeight: h } = mount;
        const camera = new THREE.PerspectiveCamera(50, Math.max(w, 1) / Math.max(h, 1), 0.01, 2000);
        camera.position.set(2, 1, 3);
        cameraRef.current = camera;

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controlsRef.current = controls;

        // Bright, even lighting to match Meshy.ai appearance
        // 1. Strong ambient light for overall brightness
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        scene.add(ambientLight);
        
        // 2. Hemisphere light for natural fill
        const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.7);
        hemisphereLight.position.set(0, 20, 0);
        scene.add(hemisphereLight);
        
        // 3. Main directional light - bright and even
        const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
        mainLight.position.set(5, 10, 5);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        scene.add(mainLight);
        
        // 4. Secondary light from opposite side
        const secondaryLight = new THREE.DirectionalLight(0xffffff, 1.0);
        secondaryLight.position.set(-5, 8, -5);
        scene.add(secondaryLight);
        
        // 5. Front fill light to reduce shadows
        const frontLight = new THREE.DirectionalLight(0xffffff, 0.8);
        frontLight.position.set(0, 5, 10);
        scene.add(frontLight);

        // Load GLB model with material preservation
        const loader = new GLTFLoader();
        const gltf = await loader.loadAsync(glbUrl);
        
        // Traverse and ensure materials are properly configured for color display
        gltf.scene.traverse((child) => {
          if (child.isMesh) {
            // Preserve original materials from GLTF
            if (child.material) {
              // Ensure materials respond to lighting
              if (Array.isArray(child.material)) {
                child.material.forEach(mat => {
                  if (mat.isMaterial) {
                    mat.needsUpdate = true;
                  }
                });
              } else {
                child.material.needsUpdate = true;
              }
              // Enable shadow casting for better depth
              child.castShadow = true;
              child.receiveShadow = true;
            }
          }
        });
        
        scene.add(gltf.scene);
        modelRef.current = gltf.scene; // Store reference for raycasting

        // Fit camera to model
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxSize = Math.max(size.x, size.y, size.z);
        camera.position.copy(center);
        camera.position.x += maxSize;
        camera.position.y += maxSize * 0.5;
        camera.position.z += maxSize;
        camera.lookAt(center);
        controls.target.copy(center);
        controls.update();

        // Create tags
        console.log('Creating tags:', tags.length);
        tags.forEach(tagData => {
          const tagGroup = createTag(tagData);
          scene.add(tagGroup);
          tagsRef.current.set(tagData.id, tagGroup);
          console.log('Created tag:', tagData.name, 'at position:', tagData.position);
        });

        // Add mouse event listeners
        mount.addEventListener('mousedown', handleMouseDown);
        mount.addEventListener('mousemove', handleMouseMove);
        mount.addEventListener('mouseup', handleMouseUp);
        
        // Create drag tooltip
        const tooltip = document.createElement('div');
        tooltip.style.cssText = `
          position: fixed;
          background: rgba(17,18,22,0.95);
          color: #e5e7eb;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 12px;
          pointer-events: none;
          z-index: 10000;
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(8px);
          display: none;
        `;
        document.body.appendChild(tooltip);
        dragTooltipRef.current = tooltip;
        
        setStatus('Ready');

        // Animation loop
        function animate() {
          if (disposed) return;
          frameRef.current = requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene, camera);
        }
        animate();

        // Handle resize
        function handleResize() {
          if (disposed) return;
          const { clientWidth: w, clientHeight: h } = mount;
          camera.aspect = Math.max(w, 1) / Math.max(h, 1);
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
        window.addEventListener('resize', handleResize);
        handleResize();

        return () => {
          window.removeEventListener('resize', handleResize);
          mount.removeEventListener('mousedown', handleMouseDown);
          mount.removeEventListener('mousemove', handleMouseMove);
          mount.removeEventListener('mouseup', handleMouseUp);
          if (dragTooltipRef.current) {
            document.body.removeChild(dragTooltipRef.current);
          }
        };

      } catch (err) {
        console.error('Scene3D error:', err);
        setError(err.message || 'Unknown error');
      }
    }

    boot();

    return () => {
      disposed = true;
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      // Clean up refs
      if (dragTooltipRef.current && document.body.contains(dragTooltipRef.current)) {
        document.body.removeChild(dragTooltipRef.current);
      }
      tagsRef.current.clear();
    };
  }, [glbUrl, tags, createTag, handleMouseDown, handleMouseMove, handleMouseUp]);

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative', background: '#2a2a2a' }}>
      <div
        ref={mountRef}
        style={{ height: '100%', width: '100%' }}
      />
      
      {/* Controls overlay */}
      <div 
        className="scene-controls-overlay"
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          zIndex: 1000
        }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            style={{
              padding: '8px 12px',
              background: isEditMode ? '#22c55e' : 'rgba(17,18,22,0.8)',
              color: isEditMode ? '#000' : '#e5e7eb',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              fontWeight: '500'
            }}
          >
            {isEditMode ? '✓ Exit Edit' : '✏️ Edit Tags'}
          </button>
          
          {isEditMode && (
            <button
              onClick={() => setSnapToGrid(!snapToGrid)}
              style={{
                padding: '8px 12px',
                background: snapToGrid ? '#3b82f6' : 'rgba(17,18,22,0.8)',
                color: snapToGrid ? '#fff' : '#e5e7eb',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
                fontWeight: '500'
              }}
            >
              {snapToGrid ? '⚡ Grid On' : '⚡ Grid Off'}
            </button>
          )}
        </div>
        
        {isEditMode && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="save-tags-button"
              onClick={saveTags}
              style={{
                padding: '8px 12px',
                background: 'rgba(34,197,94,0.8)',
                color: '#000',
                border: '1px solid rgba(34,197,94,0.3)',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
                fontWeight: '500'
              }}
            >
              💾 Save Tags
            </button>
            
            <button
              onClick={resetTags}
              style={{
                padding: '8px 12px',
                background: 'rgba(239,68,68,0.8)',
                color: '#fff',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
                fontWeight: '500'
              }}
            >
              🔄 Reset
            </button>
          </div>
        )}
      </div>

      {/* Status overlay */}
      {status !== 'Ready' && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(17,18,22,0.9)',
          padding: '20px',
          borderRadius: '8px',
          color: '#e5e7eb',
          zIndex: 1000
        }}>
          {error ? `Error: ${error}` : status}
        </div>
      )}

      {/* Edit mode status and help */}
      {isEditMode && (
        <div style={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          background: 'rgba(17,18,22,0.9)',
          padding: '12px',
          borderRadius: '8px',
          color: '#e5e7eb', 
          fontSize: '12px',
          zIndex: 1000,
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(8px)',
          maxWidth: '280px'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '6px', color: '#22c55e' }}>
            ✏️ Edit Mode Active
          </div>
          <div style={{ lineHeight: '1.4' }}>
            • Click and drag tags to reposition<br/>
            • Tags snap to model surface<br/>
            • <kbd style={{background: 'rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: '3px'}}>E</kbd> Toggle edit mode<br/>
            • <kbd style={{background: 'rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: '3px'}}>S</kbd> Save positions<br/>
            • <kbd style={{background: 'rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: '3px'}}>Esc</kbd> Cancel drag
            {snapToGrid && (
              <div style={{ marginTop: '6px', color: '#3b82f6' }}>
                ⚡ Grid snapping: 25cm intervals
              </div>
            )}
          </div>
        </div>
      )}

      {/* Drag status */}
      {draggedTagName && (
        <div style={{
          position: 'absolute',
          bottom: 10,
          right: 10,
          background: 'rgba(255,107,0,0.9)',
          padding: '8px 12px',
          borderRadius: '6px',
          color: '#fff',
          fontSize: '12px',
          fontWeight: '600',
          zIndex: 1000,
          border: '1px solid rgba(255,255,255,0.2)',
          backdropFilter: 'blur(8px)'
        }}>
          🔄 Dragging: {draggedTagName}
        </div>
      )}
    </div>
  );
}

export default Scene3D;