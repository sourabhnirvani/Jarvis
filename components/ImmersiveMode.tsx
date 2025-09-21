

import React, { useEffect, useRef, useState } from 'react';
import { Conversation } from '../types';
import { X, MicOff } from './Icons';

// Type definitions for the Web Speech API
interface SpeechRecognitionAlternative { transcript: string; confidence: number; }
interface SpeechRecognitionResult { isFinal: boolean; readonly length: number; item(index: number): SpeechRecognitionAlternative; [index: number]: SpeechRecognitionAlternative; }
interface SpeechRecognitionResultList { readonly length: number; item(index: number): SpeechRecognitionResult; [index: number]: SpeechRecognitionResult; }
interface SpeechRecognitionEvent extends Event { readonly results: SpeechRecognitionResultList; }
interface SpeechRecognitionErrorEvent extends Event { readonly error: string; readonly message: string; }
interface SpeechRecognition extends EventTarget {
    continuous: boolean; interimResults: boolean; lang: string;
    start(): void; stop(): void;
    onstart: () => void; onresult: (event: SpeechRecognitionEvent) => void; onerror: (event: SpeechRecognitionErrorEvent) => void; onend: () => void;
}
interface SpeechRecognitionStatic { new(): SpeechRecognition; }

interface ImmersiveModeProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (text: string) => void;
    isLoading: boolean;
    isSpeaking: boolean;
    activeConversation: Conversation | undefined;
    onInterrupt: () => void;
    immersiveText: string;
}

export const ImmersiveMode: React.FC<ImmersiveModeProps> = (props) => {
    const { isOpen, onClose, onSend, isLoading, isSpeaking, activeConversation, onInterrupt, immersiveText } = props;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [message, setMessage] = useState('Tap the microphone to begin.');
    const [isListening, setIsListening] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
    
    const animationFrameId = useRef<number | null>(null);
    const threeObjects = useRef<any>({});
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    
    const isListeningRef = useRef(isListening);
    isListeningRef.current = isListening;

    // Use a ref to store the current mode to avoid stale closures in the animation loop.
    const modeRef = useRef<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');

    // This effect updates the modeRef whenever the component's state changes.
    // The animation loop can then read from this ref to get the latest state without re-rendering.
    useEffect(() => {
        if (isSpeaking) modeRef.current = 'speaking';
        else if (isListening) modeRef.current = 'listening';
        else if (isLoading) modeRef.current = 'thinking';
        else modeRef.current = 'idle';
    }, [isSpeaking, isListening, isLoading]);

    useEffect(() => {
        if (isOpen && navigator.permissions) {
            navigator.permissions.query({ name: 'microphone' as PermissionName })
                .then((status) => {
                    setPermissionStatus(status.state);
                    status.onchange = () => {
                        setPermissionStatus(status.state);
                    };
                })
                .catch(err => {
                    console.error("Could not query microphone permission:", err);
                });
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        
        const THREE = (window as any).THREE;
        if (!THREE) {
            console.error("Three.js not loaded");
            return;
        }

        const SpeechRecognition: SpeechRecognitionStatic | undefined = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';
            
            recognition.onstart = ()=>{ setIsListening(true); setMessage('Listening...'); };
            recognition.onresult = (e: SpeechRecognitionEvent)=>{ const transcript = e.results[0][0].transcript; setMessage(`You: ${transcript}`); onSend(transcript); };
            recognition.onend = ()=>{ setIsListening(false); };
            recognition.onerror = (e: SpeechRecognitionErrorEvent)=>{
              if (e.error === 'aborted') {
                  console.log('Speech recognition was aborted.');
                  setIsListening(false);
                  return;
              }
              console.error('Speech recognition error:', e.error, e.message);
              setIsListening(false);
              if (e.error === 'not-allowed') {
                  setMessage('Microphone access denied. Click the lock icon in the address bar to change permissions.');
                  setPermissionStatus('denied');
              }
              else if (e.error === 'no-speech') setMessage('No speech detected. Try again.');
              else if (e.error === 'network') setMessage('A network error occurred during speech recognition.');
              else setMessage(`An error occurred: ${e.error}`);
            };
            recognitionRef.current = recognition;
        }

        let scene: any, camera: any, renderer: any, coreMesh: any, halo: any, particles: any, lines: any;
        const particleCount = 20000;
        const lineCount = 4000;
        const maxLineDistance = 6.5;

        const init = () => {
            const canvas = canvasRef.current;
            if(!canvas) return;

            renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            
            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 200);
            camera.position.z = 28;

            scene.add(new THREE.AmbientLight(0xffb86b, 0.06));
            scene.add(new THREE.PointLight(0xffc76b, 4.0, 120, 2));
            
            const coreFrag = `
              uniform float uTime; uniform float uPulse; varying vec3 vPos;
              vec3 hardLight(vec3 c, float k){ return c*(1.0+k*0.9); }
              void main(){
                float r = length(vPos);
                float wob = 0.18 * sin(uTime*0.9 + vPos.x*3.0) * (0.9 + vPos.y);
                float t = smoothstep(0.0 + wob, 2.2 + wob, r);
                float center = pow(1.0 - smoothstep(0.0, 0.6, r), 2.0) * (1.0 + uPulse*0.8);
                vec3 inner = vec3(1.0,0.98,0.9); vec3 outer = vec3(1.0,0.45,0.05);
                vec3 color = mix(inner, outer, clamp(t,0.0,1.0));
                float flick = 0.82 + 0.18* sin(uTime*13.0 + vPos.x*37.0);
                gl_FragColor = vec4(hardLight(color,flick)*center, center);
              }`;
            const coreGeo = new THREE.IcosahedronGeometry(4.2, 4);
            const coreMat = new THREE.ShaderMaterial({ vertexShader:`varying vec3 vPos; void main(){ vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`, fragmentShader:coreFrag, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false, uniforms:{ uTime:{value:0}, uPulse:{value:0} } });
            coreMesh = new THREE.Mesh(coreGeo, coreMat);
            scene.add(coreMesh);

            halo = new THREE.Mesh(new THREE.SphereGeometry(6.2,64,64), new THREE.MeshBasicMaterial({ color:0xff9f45, transparent:true, opacity:0.12, blending:THREE.AdditiveBlending, depthWrite:false }));
            scene.add(halo);

            const positions = new Float32Array(particleCount*3), colors = new Float32Array(particleCount*3), sizes = new Float32Array(particleCount);
            const colorCore = new THREE.Color(0xFFF8E6), colorEdge = new THREE.Color(0xFF7F00);
            for(let i=0;i<particleCount;i++){
              const i3=i*3, r=Math.random()>0.45?Math.pow(Math.random(),.6)*4.3*(.6+Math.random()*.4):4.3+Math.random()*9.8, t=Math.random()*Math.PI*2, p=Math.acos(2*Math.random()-1);
              positions[i3]=r*Math.sin(p)*Math.cos(t)*(.8+Math.random()*.45); positions[i3+1]=r*Math.sin(p)*Math.sin(t)*(.8+Math.random()*.45); positions[i3+2]=r*Math.cos(p)*(.8+Math.random()*.45);
              const c=new THREE.Color(); c.lerpColors(colorCore,colorEdge,Math.min(1,r/16));
              colors[i3]=c.r; colors[i3+1]=c.g; colors[i3+2]=c.b; sizes[i]=.12+Math.random()*.32;
            }
            const pGeo = new THREE.BufferGeometry(); pGeo.setAttribute('position', new THREE.BufferAttribute(positions,3)); pGeo.setAttribute('color', new THREE.BufferAttribute(colors,3)); pGeo.setAttribute('size', new THREE.BufferAttribute(sizes,1));
            const pMat = new THREE.ShaderMaterial({ uniforms:{uScale:{value:1}}, vertexShader:`attribute float size; varying vec3 vColor; void main(){ vColor = color; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = size * (200.0 / -mv.z); gl_Position = projectionMatrix * mv; }`, fragmentShader:`varying vec3 vColor; void main(){ float d=length(gl_PointCoord-vec2(.5)); gl_FragColor=vec4(vColor, smoothstep(.5,0.,d)); }`, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false, vertexColors:true });
            particles = new THREE.Points(pGeo, pMat); scene.add(particles);

            const linePos = new Float32Array(lineCount*2*3);
            const particlePositions = pGeo.attributes.position.array;
            for(let i=0,idx=0;i<lineCount;i++){
              const a=Math.floor(Math.random()*particleCount),b=Math.floor(Math.random()*particleCount);
              const ax=particlePositions[a*3],ay=particlePositions[a*3+1],az=particlePositions[a*3+2],bx=particlePositions[b*3],by=particlePositions[b*3+1],bz=particlePositions[b*3+2];
              if(Math.sqrt(Math.pow(ax-bx,2)+Math.pow(ay-by,2)+Math.pow(az-bz,2))<maxLineDistance){linePos[idx++]=ax;linePos[idx++]=ay;linePos[idx++]=az;linePos[idx++]=bx;linePos[idx++]=by;linePos[idx++]=bz;}
            }
            const lGeo = new THREE.BufferGeometry(); lGeo.setAttribute('position', new THREE.BufferAttribute(linePos,3));
            lines = new THREE.LineSegments(lGeo, new THREE.LineBasicMaterial({ color:0xffb86b, transparent:true, opacity:0.28, blending:THREE.AdditiveBlending, linewidth:1 })); scene.add(lines);

            threeObjects.current = { renderer, camera, scene, clock: new THREE.Clock(), coreMesh, halo, particles, lines };
            
            const onResize = () => {
                camera.aspect = window.innerWidth/window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight);
            };
            window.addEventListener('resize', onResize);
            return () => window.removeEventListener('resize', onResize);
        }

        const animate = () => {
            const { renderer, camera, scene, clock, coreMesh, halo, particles, lines } = threeObjects.current;
            if(!renderer) return;

            animationFrameId.current = requestAnimationFrame(animate);
            const time = clock.getElapsedTime();
            const mode = modeRef.current; // Read the latest mode from the ref

            coreMesh.material.uniforms.uTime.value = time;
            coreMesh.rotation.y += 0.0014;
            halo.rotation.y -= 0.0007;
            particles.rotation.y += 0.0007 + (mode === 'thinking' ? 0.0012 : 0);
            lines.rotation.y -= 0.0008 + (mode === 'thinking' ? 0.0009 : 0);

            if (mode === 'idle') { coreMesh.material.uniforms.uPulse.value = Math.sin(time * 2.0) * 0.06; } 
            else if (mode === 'listening') { coreMesh.material.uniforms.uPulse.value = 0.45 + Math.abs(Math.sin(time * 6.0)) * 0.35; } 
            else if (mode === 'thinking') { coreMesh.material.uniforms.uPulse.value = 0.7 + Math.abs(Math.sin(time * 4.0)) * 0.6; } 
            else if (mode === 'speaking') { coreMesh.material.uniforms.uPulse.value = 1.2 + Math.abs(Math.sin(time * 8.0)) * 0.9; }

            renderer.render(scene, camera);
        }
        
        const cleanupResize = init();
        animate();

        return () => {
            if (cleanupResize) cleanupResize();
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            if(recognitionRef.current && isListeningRef.current) {
                recognitionRef.current.stop();
            }
        }

    }, [isOpen, onSend]);
    
    useEffect(() => {
        if (!isOpen) return;
        
        if (immersiveText) {
            setMessage(immersiveText);
            return;
        }

        if (permissionStatus === 'denied') {
            setMessage('Microphone access is blocked. Click the lock icon in the address bar to change permissions.');
            return;
        }

        if (isLoading) {
            setMessage('Thinking...');
        } else if (!isSpeaking && !isListening) {
             const lastMessage = activeConversation?.messages[activeConversation.messages.length - 1];
             if (lastMessage?.sender === 'ai') {
                 setMessage(lastMessage.text);
             } else {
                 if (permissionStatus === 'prompt') {
                     setMessage('Tap the microphone to allow access and begin.');
                 } else {
                    setMessage('Tap the microphone to begin.');
                 }
             }
        }
    }, [isOpen, isLoading, isSpeaking, isListening, activeConversation, permissionStatus, immersiveText]);

    const handleMicClick = () => {
        if (isSpeaking) {
            onInterrupt();
        }

        if (recognitionRef.current && !isListening && !isLoading) {
            try {
                recognitionRef.current.start();
            } catch (e) {
                console.warn("Speech recognition couldn't start, possibly already active.", e);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black">
            <style>{`
                .immersive-container { font-family: 'Inter', sans-serif; height: 100vh; }
                .immersive-canvas { display: block; position: absolute; top: 0; left: 0; z-index: 1; }
                #ui-container { position: relative; z-index: 10; width: 100%; display: flex; flex-direction: column; align-items: center; padding: 1rem; box-sizing: border-box; background: linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0)); }
                #message-box { background: rgba(45, 45, 45, 0.7); border: 1px solid rgba(255, 165, 0, 0.3); border-radius: 12px; padding: 1rem; max-width: 90%; min-height: 40px; text-align: center; margin-bottom: 1rem; color: #fff; box-shadow: 0 0 10px rgba(255, 165, 0, 0.2); transition: all 0.5s ease-in-out; }
                #mic-button { width: 80px; height: 80px; background: rgba(255, 165, 0, 0.8); border: none; border-radius: 50%; cursor: pointer; display: flex; justify-content: center; align-items: center; transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out; box-shadow: 0 0 15px rgba(255, 165, 0, 0.6); }
                #mic-button:hover { transform: scale(1.05); }
                #mic-button.listening { animation: pulse 1.5s infinite ease-in-out; background: #fff; color: #FF7F00; box-shadow: 0 0 20px #fff; }
                #mic-button.denied { background: #4a4a4a; cursor: not-allowed; box-shadow: none; }
                #mic-button.denied:hover { transform: none; }
                @keyframes pulse { 0% { transform: scale(0.9); box-shadow: 0 0 10px rgba(255, 255, 255, 0.6); } 50% { transform: scale(1.1); box-shadow: 0 0 20px rgba(255, 255, 255, 0.8); } 100% { transform: scale(0.9); box-shadow: 0 0 10px rgba(255, 255, 255, 0.6); } }
            `}</style>
            <canvas ref={canvasRef} className="immersive-canvas"></canvas>
            <div className="flex flex-col justify-end items-center immersive-container">
                <div id="ui-container">
                    <button onClick={onClose} className="absolute top-4 right-4 text-white p-2 rounded-full bg-black/20 hover:bg-black/50 transition-colors z-20">
                        <X className="w-6 h-6" />
                    </button>
                    <div id="message-box">{message}</div>
                    <button 
                        id="mic-button" 
                        aria-label={permissionStatus === 'denied' ? "Microphone access blocked" : "Start talking"}
                        onClick={handleMicClick} 
                        disabled={permissionStatus === 'denied' || isLoading}
                        className={`${isListening ? 'listening' : ''} ${permissionStatus === 'denied' ? 'denied' : ''}`}
                    >
                        {permissionStatus === 'denied' ? (
                            <MicOff width="32" height="32" stroke="white" />
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                <line x1="12" y1="19" x2="12" y2="23"></line>
                                <line x1="8" y1="23" x2="16" y2="23"></line>
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
