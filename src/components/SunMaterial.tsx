//src/components/SunMaterial.tsx
import * as THREE from "three";
import { extend, useFrame, type ThreeElement } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import { useMemo, useRef } from "react";

const noiseFunctions = `
  vec3 hash33(vec3 p) { 
      p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
               dot(p, vec3(269.5, 183.3, 246.1)),
               dot(p, vec3(113.5, 271.9, 124.6)));
      return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }

  float noise3D(vec3 p) {
      vec3 i = floor(p);
      vec3 f = fract(p);
      vec3 u = f * f * (3.0 - 2.0 * f);
      
      return mix( mix( mix( dot( hash33( i + vec3(0.0,0.0,0.0) ), f - vec3(0.0,0.0,0.0) ), 
                            dot( hash33( i + vec3(1.0,0.0,0.0) ), f - vec3(1.0,0.0,0.0) ), u.x),
                       mix( dot( hash33( i + vec3(0.0,1.0,0.0) ), f - vec3(0.0,1.0,0.0) ), 
                            dot( hash33( i + vec3(1.0,1.0,0.0) ), f - vec3(1.0,1.0,0.0) ), u.x), u.y),
                  mix( mix( dot( hash33( i + vec3(0.0,0.0,1.0) ), f - vec3(0.0,0.0,1.0) ), 
                            dot( hash33( i + vec3(1.0,0.0,1.0) ), f - vec3(1.0,0.0,1.0) ), u.x),
                       mix( dot( hash33( i + vec3(0.0,1.0,1.0) ), f - vec3(0.0,1.0,1.0) ), 
                            dot( hash33( i + vec3(1.0,1.0,1.0) ), f - vec3(1.0,1.0,1.0) ), u.x), u.y), u.z );
  }

  // FBM avec plus d'octaves pour un grain beaucoup plus fin (style VLC snap)
  float fbm(vec3 p) {
      float f = 0.0;
      float amp = 0.5;
      for(int i = 0; i < 6; i++) { // Passé à 6 octaves pour plus de détails
          f += amp * noise3D(p);
          p *= 2.0;
          amp *= 0.5;
      }
      return f;
  }
`;

const SunShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uMap: null as THREE.Texture | null,
    uColor1: new THREE.Color("#ffffff"), // Blanc pur (les points les plus chauds de la 2e image)
    uColor2: new THREE.Color("#ffb400"), // Jaune-Orange très lumineux
    uColor3: new THREE.Color("#600000"), // Rouge très sombre/Noir (les crevasses de la 2e image)
    uMixAmount: 0.65, // Équilibre entre la texture et le bruit procédural
  },
  // ================== VERTEX SHADER ==================
  `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    uniform float uTime;
    ${noiseFunctions}

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;

      // Déplacement léger pour faire "respirer" l'étoile
      float noiseDisp = fbm(position * 4.0 + uTime * 0.2) * 0.02;
      vec3 pos = position + normal * noiseDisp;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  // ================== FRAGMENT SHADER ==================
  `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    uniform float uTime;
    uniform sampler2D uMap;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uColor3;
    uniform float uMixAmount;

    ${noiseFunctions}

    void main() {
      // 1. LECTURE DE LA TEXTURE 2K (pour les grandes variations)
      // On anime très légèrement les UVs pour que la texture tourne/glisse lentement
      //vec2 animatedUv = vUv + vec2(uTime * 0.005, 0.0);
      //vec4 baseTex = texture2D(uMap, animatedUv);


      // 1. LECTURE DE LA TEXTURE 2K (pour les grandes variations)
// L'utilisation de fract() crée une boucle parfaite et empêche l'étirement
vec2 animatedUv = vec2(fract(vUv.x + uTime * 0.005), vUv.y);
vec4 baseTex = texture2D(uMap, animatedUv);

    /*   // 2. CRÉATION DU BRUIT GRANULEUX (Style 2e image)
      // On utilise une échelle élevée (vPosition * 12.0) pour avoir un grain très fin
      vec3 p = vPosition * 12.0 + vec3(uTime * 0.3, uTime * 0.1, uTime * 0.2);
      
      // On déforme le bruit par un autre bruit pour créer ces filaments/veines caractéristiques
      float noise1 = fbm(p);
      float noise2 = fbm(p + vec3(noise1 * 2.0));
      
      // Le "abs" crée des crêtes pointues (effet de feu/plasma vif)
      float plasma = abs(noise2); 
      
      // On contraste violemment le plasma (0.0 = noir profond, 1.0 = blanc pur)
      plasma = smoothstep(0.01, 0.98, plasma); */
            // 2. CRÉATION DU BRUIT (Tourbillons plus gros)
      // On passe de 12.0 à 4.0 (ou 3.0) pour agrandir considérablement les motifs.
      // J'ai aussi ralenti un peu l'animation (uTime * 0.15) pour que les gros tourbillons soient majestueux.
      vec3 p = vPosition * 4.0 + vec3(uTime * 0.15, uTime * 0.05, uTime * 0.1);
      
      // On déforme le bruit par un autre bruit (Domain Warping).
      float noise1 = fbm(p);
      
      // On augmente le multiplicateur ici (de 2.0 à 3.5 ou 4.0) ! 
      // C'est ça qui "tord" le plasma et crée de gros tourbillons filandreux.
      float noise2 = fbm(p + vec3(noise1 * 3.5));
      
      float plasma = abs(noise2); 
      plasma = smoothstep(0.1, 0.8, plasma);

      // 3. COLORATION DU PLASMA (3 tons)
      vec3 plasmaColor;
      if (plasma < 0.5) {
          // De sombre (uColor3) à jaune (uColor2)
          plasmaColor = mix(uColor3, uColor2, plasma * 2.0);
      } else {
          // De jaune (uColor2) à blanc incandescent (uColor1)
          plasmaColor = mix(uColor2, uColor1, (plasma - 0.5) * 2.0);
      }

      // 4. MIX : TEXTURE + PLASMA PROCÉDURAL
      // On utilise la luminosité de la texture de base pour influencer l'intensité du plasma
      float texLuminance = dot(baseTex.rgb, vec3(0.299, 0.587, 0.114));
    float plasmaBoost = mix(0.7, 1.2, texLuminance);
      
      // Les zones sombres de la texture 2K (taches) resteront plus sombres
      //vec3 finalColor = mix(baseTex.rgb, plasmaColor * (texLuminance + 0.5), uMixAmount);
            vec3 finalColor = mix(baseTex.rgb, plasmaColor * (plasmaBoost), uMixAmount);

  /*          // 4. MIX : TEXTURE + PLASMA PROCÉDURAL (Masque basé sur la luminosité)
      
      // On calcule la luminosité de la texture 2K (0.0 = noir profond, 1.0 = blanc pur)
      float texLuminance = dot(baseTex.rgb, vec3(0.299, 0.587, 0.114));
      
      // On crée un masque inversé avec smoothstep :
      // - Si la texture est claire (> 0.6), le masque tombe à 0.0 (plasma caché)
      // - Si la texture est sombre (< 0.2), le masque monte à 1.0 (plasma très visible)
      float darkZoneMask = smoothstep(0.6, 0.2, texLuminance);
      
      // On combine ce masque avec votre paramètre uMixAmount.
      // Le mix(0.15, 1.0, darkZoneMask) permet de garder quand même 15% de plasma 
      // dans les zones lumineuses pour que l'ensemble reste cohérent.
      float localMix = mix(0.25, 1.0, darkZoneMask) * uMixAmount;
      
      // On applique le mélange final
      vec3 finalColor = mix(baseTex.rgb, plasmaColor, localMix); */

      // 5. EFFET DE BORD (Couronne)
      float fresnel = pow(1.0 - max(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)), 0.0), 3.0);
      finalColor += uColor2 * fresnel * 0.8; // Halo orangé sur les bords

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `,
);

extend({ SunShaderMaterial });

// ... (le reste des déclarations TypeScript reste identique)

type SunMaterialProps = {
  map: THREE.Texture;
  mixAmount?: number;
};

export function SunMaterial({ map, mixAmount = 0.65 }: SunMaterialProps) {
  const ref = useRef<InstanceType<typeof SunShaderMaterial> | null>(null);

  const uniforms = useMemo(
    () => ({
      uMap: map,
      // On injecte les couleurs extrêmes de votre 2ème image
      uColor1: new THREE.Color("#ffffff"), // Pics de chaleur blancs
      uColor2: new THREE.Color("#ffaa00"), // Coeur orange vif
      uColor3: new THREE.Color("#3a0000"), // Crevasses rouges très sombres
      uMixAmount: mixAmount,
    }),
    [map, mixAmount],
  );

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.uTime += delta;
  });

  return <sunShaderMaterial ref={ref} {...uniforms} />;
}
