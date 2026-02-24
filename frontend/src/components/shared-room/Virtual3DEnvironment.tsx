import { useEffect, useRef } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Camera } from 'lucide-react';
import * as THREE from 'three';

interface Virtual3DEnvironmentProps {
  localVideoStream: MediaStream;
  selectedAngle: 'stage' | 'side' | 'group';
  canvasRef?: React.MutableRefObject<HTMLCanvasElement | null>;
  onCapturePhoto?: () => void;
}

export default function Virtual3DEnvironment({
  localVideoStream,
  selectedAngle,
  canvasRef,
  onCapturePhoto,
}: Virtual3DEnvironmentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const videoTextureRef = useRef<THREE.VideoTexture | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.6, 5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    if (canvasRef) {
      canvasRef.current = renderer.domElement;
    }

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffa500, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0x00ffff, 0.3);
    fillLight.position.set(-5, 5, -5);
    scene.add(fillLight);

    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.8,
      metalness: 0.2,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
    scene.add(gridHelper);

    const video = document.createElement('video');
    video.srcObject = localVideoStream;
    video.play();

    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;
    videoTextureRef.current = videoTexture;

    const videoGeometry = new THREE.PlaneGeometry(1.6, 2.4);
    const videoMaterial = new THREE.MeshBasicMaterial({
      map: videoTexture,
      side: THREE.DoubleSide,
    });
    const videoPlane = new THREE.Mesh(videoGeometry, videoMaterial);
    videoPlane.position.set(-2, 1.2, 0);
    scene.add(videoPlane);

    const placeholderGeometry = new THREE.PlaneGeometry(1.6, 2.4);
    const placeholderMaterial = new THREE.MeshStandardMaterial({
      color: 0x14b8a6,
      emissive: 0x14b8a6,
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.7,
    });
    const placeholderPlane = new THREE.Mesh(placeholderGeometry, placeholderMaterial);
    placeholderPlane.position.set(2, 1.2, 0);
    scene.add(placeholderPlane);

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      videoTexture.dispose();
      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [localVideoStream, canvasRef]);

  useEffect(() => {
    if (!cameraRef.current) return;

    const camera = cameraRef.current;
    const positions = {
      stage: { x: 0, y: 1.6, z: 5 },
      side: { x: 5, y: 1.6, z: 0 },
      group: { x: 0, y: 3, z: 7 },
    };

    const targetPos = positions[selectedAngle];
    camera.position.set(targetPos.x, targetPos.y, targetPos.z);
    camera.lookAt(0, 1.2, 0);
  }, [selectedAngle]);

  return (
    <Card className="relative overflow-hidden">
      <div
        ref={containerRef}
        className="w-full bg-black"
        style={{ minHeight: '600px', aspectRatio: '16/9' }}
      />
      {onCapturePhoto && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <Button onClick={onCapturePhoto} size="lg" className="shadow-lg">
            <Camera className="w-5 h-5 mr-2" />
            Capture Photo
          </Button>
        </div>
      )}
    </Card>
  );
}
