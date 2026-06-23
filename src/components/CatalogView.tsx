"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { 
  Wind, 
  ArrowRight, 
  Sun, 
  Moon, 
  Download, 
  Calendar, 
  FileText, 
  Mail, 
  Phone, 
  MapPin, 
  Filter, 
  Check, 
  Loader2, 
  Maximize2,
  Sliders,
  ChevronRight,
  User,
  Settings,
  Target,
  Award,
  ShieldCheck,
  FileCheck
} from "lucide-react";
import { CatalogCategory } from "@/app/actions/catalog";
import { submitContactForm } from "@/app/actions/leads";
// Dynamically generate engineering specification cards based on product name and attributes
const getEngineeringSpecs = (product: any) => {
  if (!product) return {
    acople: "Directo",
    aislamiento: "Clase F",
    rodamientos: "SKF L10",
    balanceo: "G2.5",
    tempMax: "80°C",
    thickness: "3.4mm",
    curvePath: "M 30 30 Q 130 45 270 100",
    ptX: 150,
    ptY: 50,
    description: ""
  };
  
  const name = product.name || "";
  const nameLower = name.toLowerCase();
  
  // Use a simple hash of the name or ID to generate unique parameters per equipment
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const uniqueSeed = Math.abs(hash);
  
  const isCentrifugal = nameLower.includes("centrífugo") || nameLower.includes("blower") || nameLower.includes("hongo");
  const isAxial = nameLower.includes("axial") || nameLower.includes("tubo");
  
  let acople = "Directo por Manguito Flexible";
  let aislamiento = "Clase H (Hasta 180°C) - IP55";
  let rodamientos = "SKF de doble hilera de rodillos (L10 > 50,000h)";
  let balanceo = "Grado G2.5 (ISO 1940-1) - Residual < 1.0 mm/s";
  let tempMax = "80°C Continua / 120°C Picos";
  let thickness = 'Calibre 3/16" (4.70mm) Soldadura Continua';
  
  // Create unique curves
  let curvePath = "";
  let ptX = 0;
  let ptY = 0;
  let description = "";
  
  // Generate random but deterministic operating points unique to this product ID/name
  const offset1 = (uniqueSeed % 15) - 7;
  const offset2 = (uniqueSeed % 20) - 10;
  const offset3 = (uniqueSeed % 25);
  
  if (isCentrifugal) {
    acople = (uniqueSeed % 2 === 0) 
      ? "Transmisión por Poleas y Correas con Tensor Automático" 
      : "Acople Directo Integrado por Brida Monobloc";
    aislamiento = "Clase F / H - IP56 (Alta Humedad y Polvillo)";
    rodamientos = "Rodamientos SKF autoalineables en chumacera bipartida (L10 > 100,000h)";
    balanceo = "Grado G2.5 dinámico por balanceador de plano dual (ISO 1940)";
    tempMax = (uniqueSeed % 2 === 0) ? "150°C Operación Continua" : "250°C con Disco de Enfriamiento Especial";
    thickness = 'Calibre 1/4" (6.35mm) Acero Estructural ASTM A36';
    
    // Centrifugal curve: steep drop, peaks early.
    const peakY = 20 + (uniqueSeed % 10);
    const midY = 55 + offset1;
    const endY = 115 + offset2;
    curvePath = `M 30 ${peakY} Q 120 ${midY} 270 ${endY}`;
    ptX = 110 + (uniqueSeed % 40);
    ptY = Math.round(peakY + (ptX - 30) * (endY - peakY) / 240 + offset1 / 2);
    
    description = `Turbomáquina centrífuga de alta eficiencia diseñada para vencer caídas de presión elevadas en naves industriales complejas. Equipado con álabes atrasados auto-autolimpiantes balanceados bajo norma ISO 1940-1 G2.5, reduciendo la vibración residual a menos de 1.2 mm/s. Su voluta soldada de flujo continuo asegura una conversión óptima de presión dinámica a estática, garantizando una operación estable a bajas revoluciones y un consumo energético reducido en plantas cementeras, mineras y químicas.`;
  } else if (isAxial) {
    acople = (uniqueSeed % 2 === 0)
      ? "Acople Directo (Hélice montada sobre el eje del motor)"
      : "Transmisión por Poleas y Correas (Motor externo al flujo)";
    aislamiento = "Clase H - Aislamiento F400 (Resiste 400°C por 2 horas)";
    rodamientos = "Rodamientos de bolas prelubricados de por vida, sellados de fábrica";
    balanceo = "Balanceado estático y dinámico en fábrica a Grado G2.5";
    tempMax = "60°C de operación estándar (Apto para extracción de humos calientes)";
    thickness = 'Calibre 12 (2.70mm) Acero al Carbono Galvanizado en Caliente por inmersión';
    
    // Axial curve: flatter with a dip.
    const startY = 45 + (uniqueSeed % 10);
    const midY = 65 + offset1;
    const endY = 95 + offset2;
    curvePath = `M 30 ${startY} Q 160 ${midY} 270 ${endY}`;
    ptX = 140 + (uniqueSeed % 50);
    ptY = Math.round(startY + (ptX - 30) * (endY - startY) / 240 + offset2 / 3);
    
    description = `Extractor tubo-axial industrial para alto volumen de flujo y baja presión estática. Fabricado con álabes de perfil aerofoil ajustables en reposo para optimizar la aerodinámica según la densidad del aire en la zona de instalación. El chasis cilíndrico de acero pesado con bridas empernables reduce las turbulencias de entrada. Ideal para ventilación general en plantas de ensamblaje, almacenes de gran altura y procesos de refrigeración forzada que exigen confiabilidad ininterrumpida.`;
  } else {
    // Utility / Inline / Roof fans
    acople = "Directo por Eje Estriado Flotante";
    aislamiento = "Clase F - IP54";
    rodamientos = "Rodamientos NSK sellados de bajo ruido (L10 > 60,000h)";
    balanceo = "Grado G2.5 - Vibración controlada por amortiguación elastomerica";
    tempMax = "80°C Continua";
    thickness = "Calibre 14 (1.90mm) Aluminio naval resistente a corrosión marina";
    
    // Inline / Utility curve: medium profile
    const startY = 35 + (uniqueSeed % 10);
    const midY = 50 + offset1;
    const endY = 105 + offset2;
    curvePath = `M 30 ${startY} Q 140 ${midY} 270 ${endY}`;
    ptX = 130 + (uniqueSeed % 40);
    ptY = Math.round(startY + (ptX - 30) * (endY - startY) / 240);
    
    description = `Unidad de ventilación industrial multiuso optimizada para naves de almacenamiento y techados industriales. Desarrollada para operar de manera silenciosa mediante álabes radiales curvados y un recubrimiento acústico interno de alta densidad. Su persiana de gravedad integrada abre por presión estática diferencial. Cumple estrictamente con la norma de seguridad laboral para recintos cerrados con una atenuación acústica certificada por debajo de 70 dB a 1.5 metros.`;
  }
  
  return { acople, aislamiento, rodamientos, balanceo, tempMax, thickness, curvePath, ptX, ptY, description };
};

interface CatalogViewProps {
  catalog: CatalogCategory[];
  branding: Record<string, any>;
  tenantCode: string;
}

export default function CatalogView({ catalog, branding, tenantCode }: CatalogViewProps) {
  // Theme state independent of CRM/ERP, local to landing page (Locked to light)
  const [landingTheme, setLandingTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  // Filter states (Unused since filters are removed, keeping for variable safety)
  const [cfmFilter, setCfmFilter] = useState<number>(25000);
  const [pressureFilter, setPressureFilter] = useState<number>(5.0);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    phone: "",
    email: "",
    urgency: "media",
    description: ""
  });
  const [isPending, startTransition] = useTransition();
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Modal states for case studies & technical downloads
  const [activeCaseStudy, setActiveCaseStudy] = useState<string | null>(null);
  const [activeDocDownload, setActiveDocDownload] = useState<string | null>(null);
  const [comparedProductIds, setComparedProductIds] = useState<string[]>([]);
  const [activeProductDetails, setActiveProductDetails] = useState<any>(null);
  const specs = activeProductDetails ? getEngineeringSpecs(activeProductDetails) : null;
  
  // Active company tab state
  const [activeEmpresaTab, setActiveEmpresaTab] = useState<"capacidades" | "certificaciones" | "seguridad">("capacidades");

  useEffect(() => {
    setMounted(true);
    setLandingTheme("light");
  }, []);

  const toggleLandingTheme = () => {
    // Toggler disabled, locked to light
  };

  // Branding visual properties
  const primaryColor = branding.color_primario || "#0284c7";
  const siteName = branding.nombre_comercial || "SISTEMAS DE VENTILACIÓN";
  const siteLogo = branding.logo_claro_url || "";

  // Flatten products from database catalog tree
  const products = catalog.flatMap(cat => 
    cat.subcategories.flatMap(sub => 
      sub.families.flatMap(fam => 
        fam.series.flatMap(ser => 
          ser.products.map(prod => {
            const specs = prod.specifications || {};
            const nameLower = prod.name.toLowerCase();

            // Default values
            let cfmMin = 1000;
            let cfmMax = 10000;
            let pressMin = 0.1;
            let pressMax = 1.5;
            let material = specs["material"] || specs["Material"] || "Acero Galvanizado";
            let power = specs["potencia"] || specs["Potencia"] || specs["motor"] || specs["Motor"] || "1.5 HP";

            if (nameLower.includes("hongo") || nameLower.includes("techo")) {
              cfmMin = 1500;
              cfmMax = 12000;
              pressMin = 0.2;
              pressMax = 1.2;
              material = specs["material"] || specs["Material"] || "Acero Inoxidable 304";
              power = specs["potencia"] || specs["Potencia"] || specs["motor"] || specs["Motor"] || "2.0 HP";
            } else if (nameLower.includes("axial") && nameLower.includes("tubo")) {
              cfmMin = 2000;
              cfmMax = 18000;
              pressMin = 0.2;
              pressMax = 1.0;
              material = specs["material"] || specs["Material"] || "Acero Pintado Epóxico";
              power = specs["potencia"] || specs["Potencia"] || specs["motor"] || specs["Motor"] || "3.0 HP";
            } else if (nameLower.includes("axial")) {
              cfmMin = 5000;
              cfmMax = 25000;
              pressMin = 0.1;
              pressMax = 0.6;
              material = specs["material"] || specs["Material"] || "Aluminio / Acero";
              power = specs["potencia"] || specs["Potencia"] || specs["motor"] || specs["Motor"] || "5.0 HP";
            } else if (nameLower.includes("centrífugo") || nameLower.includes("blower")) {
              cfmMin = 2500;
              cfmMax = 20000;
              pressMin = 0.5;
              pressMax = 4.5;
              material = specs["material"] || specs["Material"] || "Acero Reforzado";
              power = specs["potencia"] || specs["Potencia"] || specs["motor"] || specs["Motor"] || "7.5 HP";
            } else if (nameLower.includes("encajonado")) {
              cfmMin = 1200;
              cfmMax = 12000;
              pressMin = 0.2;
              pressMax = 1.5;
              material = specs["material"] || specs["Material"] || "Gabinete Acústico Galv";
              power = specs["potencia"] || specs["Potencia"] || specs["motor"] || specs["Motor"] || "1.5 HP";
            }

            // Derive technical parameters for B2B industrial display
            const sku = prod.productCode || `AX-${prod.id.slice(0, 6).toUpperCase()}`;
            const subtitle = nameLower.includes("hongo") ? "Extractor de Techo Centrífugo"
                           : nameLower.includes("tubo") ? "Ventilador Tubo Axial de Media Presión"
                           : nameLower.includes("axial") ? "Ventilador Axial de Alta Presión"
                           : nameLower.includes("centrífugo") ? "Soplador Centrífugo de Alta Capacidad"
                           : nameLower.includes("encajonado") ? "Unidad de Ventilación Acústica"
                           : "Ventilador Industrial de Ingeniería";

            const caudalVal = specs["caudal"] || specs["Caudal"] || `${Math.round(cfmMax * 1.7).toLocaleString("es-CO")} m³/h`;
            const presionVal = specs["presion"] || specs["Presión"] || `${Math.round(pressMax * 249)} Pa`;
            const motorVal = power;
            const eficienciaVal = specs["eficiencia"] || specs["Eficiencia"] || "92%";
            const ruidoVal = specs["ruido"] || specs["Ruido"] || "68 dB";

            // Certifications
            let certificaciones: string[] = [];
            if (specs["certificaciones"] || specs["Certificaciones"]) {
              certificaciones = (specs["certificaciones"] || specs["Certificaciones"]).split(",").map((c: string) => c.trim());
            } else {
              certificaciones = ["ISO 5801", "CE"];
              if (nameLower.includes("axial")) certificaciones.push("ATEX", "IP55");
              else if (nameLower.includes("centrífugo")) certificaciones.push("UL", "NEMA");
              else certificaciones.push("IP54");
              
              if (!nameLower.includes("importado")) {
                certificaciones.push("Fabricación Nacional");
              }
            }

            // Applications
            let aplicaciones: string[] = [];
            if (specs["aplicaciones"] || specs["Aplicaciones"]) {
              aplicaciones = (specs["aplicaciones"] || specs["Aplicaciones"]).split(",").map((a: string) => a.trim());
            } else {
              if (nameLower.includes("axial")) {
                aplicaciones = ["Cementeras", "Acerías", "Minería", "Plantas químicas"];
              } else if (nameLower.includes("centrífugo")) {
                aplicaciones = ["Petroquímica", "Papelera", "Cementeras", "Silos"];
              } else if (nameLower.includes("hongo")) {
                aplicaciones = ["Hospitales", "Laboratorios", "Alimentos", "Cocinas"];
              } else {
                aplicaciones = ["Minería", "Cemento", "Alimentos", "Química"];
              }
            }

            // Corner Badge
            let badge = "ATEX";
            if (nameLower.includes("hongo")) badge = "PREMIUM";
            else if (nameLower.includes("tubo")) badge = "BEST SELLER";
            else if (nameLower.includes("encajonado")) badge = "NUEVO";
            else if (nameLower.includes("centrífugo")) badge = "PERSONALIZABLE";

            // Status
            let status = "Disponible";
            if (prod.status) {
              status = prod.status;
            } else {
              if (nameLower.includes("tubo") || nameLower.includes("centrífugo")) status = "Fabricación Especial";
              else if (nameLower.includes("hongo")) status = "Entrega inmediata";
              else status = "Bajo pedido";
            }

            // Visual meter values (0-100)
            let metricsRatings = { caudal: 80, presion: 70, ruido: 40, eficiencia: 92 };
            if (nameLower.includes("hongo")) {
              metricsRatings = { caudal: 45, presion: 35, ruido: 25, eficiencia: 88 };
            } else if (nameLower.includes("tubo")) {
              metricsRatings = { caudal: 70, presion: 60, ruido: 65, eficiencia: 90 };
            } else if (nameLower.includes("axial")) {
              metricsRatings = { caudal: 90, presion: 80, ruido: 55, eficiencia: 92 };
            } else if (nameLower.includes("centrífugo")) {
              metricsRatings = { caudal: 60, presion: 95, ruido: 80, eficiencia: 94 };
            } else if (nameLower.includes("encajonado")) {
              metricsRatings = { caudal: 55, presion: 45, ruido: 20, eficiencia: 89 };
            }

            return {
              id: prod.id,
              productCode: prod.productCode,
              name: prod.name,
              description: prod.description || "",
              cfmMin,
              cfmMax,
              pressMin,
              pressMax,
              material,
              power,
              categoryName: cat.name,
              familyName: fam.name,
              sku,
              subtitle,
              caudalVal,
              presionVal,
              motorVal,
              eficienciaVal,
              ruidoVal,
              certificaciones,
              aplicaciones,
              badge,
              status,
              metricsRatings,
              images: prod.images || [],
              documents: prod.documents || [],
              cadFiles: prod.cadFiles || []
            };
          })
        )
      )
    )
  );

  // Return all products since catalog filters are removed
  const filteredProducts = products;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess(false);

    startTransition(async () => {
      try {
        await submitContactForm(tenantCode, {
          name: formData.name,
          companyName: formData.companyName,
          phone: formData.phone,
          email: formData.email,
          urgency: formData.urgency,
          description: formData.description
        });
        setSubmitSuccess(true);
        setFormData({
          name: "",
          companyName: "",
          phone: "",
          email: "",
          urgency: "media",
          description: ""
        });
      } catch (err: any) {
        setSubmitError(err.message || "Error al enviar la solicitud.");
      }
    });
  };

  const services = [
    {
      code: "SRV-01",
      title: "Balanceo Estático y Dinámico",
      description: "Corrección milimétrica de distribución de pesos y alineación del eje de giro para alcanzar niveles de vibración admisibles bajo norma ISO 1940.",
      icon: <Sliders className="w-6 h-6 text-sky-500" />
    },
    {
      code: "SRV-02",
      title: "Mediciones Aerodinámicas",
      description: "Determinación en campo de caudales de aire (CFM), presiones estáticas, perfiles de velocidad y levantamiento físico de curvas de rendimiento reales.",
      icon: <Wind className="w-6 h-6 text-emerald-500" />
    },
    {
      code: "SRV-03",
      title: "Fabricación y Reparación",
      description: "Reconstrucción estructural de turbinas, soldadura especializada homologada, cambio de rodamientos y alineación láser de sistemas de transmisión.",
      icon: <Sliders className="w-6 h-6 text-indigo-500" />
    },
    {
      code: "SRV-04",
      title: "Sistemas de Extracción/Inyección",
      description: "Diseño termodinámico y montaje de unidades tipo hongo en acero inoxidable con instrumentación digital de presión diferencial integrada.",
      icon: <Wind className="w-6 h-6 text-amber-500" />
    }
  ];

  const caseStudies = [
    {
      id: "case-01",
      title: "Molienda de Clinker",
      client: "Cementera del Caribe",
      description: "Optimización del flujo de aire y arrastre térmico en la cámara de molienda principal. Reducción del 14% en consumo eléctrico del extractor principal.",
      details: "Se reemplazó un ventilador axial deteriorado por un Blower de alta eficiencia balanceado dinámicamente in-situ. El caudal promedio aumentó de 12,000 CFM a 18,500 CFM constantes a una presión de 3.2 in w.g. con control de velocidad variable automatizado.",
      metrics: "Ahorro energético: 14% | Aumento flujo: +54% | Vibración: <1.2 mm/s"
    },
    {
      id: "case-02",
      title: "Presurización en Silos Portuarios",
      client: "Terminal Graneles del Norte",
      description: "Diseño e implementación de sistema de presurización controlada y filtración de aire para evitar la acumulación de polvos inflamables.",
      details: "Instalación de 4 unidades de inyección encajonadas insonorizadas con filtración G4+F7 redundante. Control de presión diferencial automatizada para garantizar un delta positivo de +15 Pa constantes contra atmósfera exterior.",
      metrics: "Presión interna: +15 Pa | Caudal: 8,500 CFM x4 | Norma: NFPA 61"
    },
    {
      id: "case-03",
      title: "Ventilación en Minería de Carbón",
      client: "Consorcio Carbonífero Guajira",
      description: "Modernización y robustecimiento de sistemas de inyección principal para galerías subterráneas profundas de explotación.",
      details: "Fabricación de 2 ventiladores tubo axiales gemelos de 60 pulgadas en acero estructural reforzado con álabes de perfil aerodinámico de ángulo variable. Soporte de presiones estáticas elevadas de hasta 4.5 in w.g.",
      metrics: "Flujo total: 95,000 CFM | Motores: 75 HP x2 | Nivel de ruido: <85 dBA"
    },
    {
      id: "case-04",
      title: "Disipación Térmica en Data Center",
      client: "DataCloud Services",
      description: "Rediseño del flujo de aire de enfriamiento del área de servidores de alta densidad mediante confinamiento de pasillo caliente.",
      details: "Balanceo termodinámico con extractores de techo tipo hongo fabricados en acero inoxidable 304, operados mediante variadores de frecuencia integrados al sistema de gestión del edificio (BMS).",
      metrics: "PUE obtenido: 1.18 | Disipación: 450 kW | Temperatura aire: 22°C ± 1°C"
    }
  ];

  return (
    <div className="min-h-screen font-sans antialiased bg-white text-zinc-900 relative">
      <style>{`
          :root {
            --brand-primary: ${primaryColor};
          }
          html {
            scroll-behavior: smooth;
          }
          @keyframes spin-slow {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .animate-spin-slow {
            animation: spin-slow 150s linear infinite;
          }
          .schematic-grid {
            background-image: radial-gradient(circle, rgba(9, 9, 11, 0.05) 1px, transparent 1px);
            background-size: 20px 20px;
          }
          .schematic-grid-dark {
            background-image: radial-gradient(circle, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
            background-size: 20px 20px;
          }
          .premium-card-light {
            background: linear-gradient(145deg, #ffffff 0%, #f9fafb 100%);
            border: 1px solid #e4e4e7;
            box-shadow: 
              0 1px 2px rgba(9, 9, 11, 0.01),
              0 12px 36px -6px rgba(9, 9, 11, 0.03),
              0 24px 60px -12px rgba(9, 9, 11, 0.05),
              inset 0 1px 0 0 rgba(255, 255, 255, 0.85);
            transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          }
          .premium-card-light:hover {
            transform: translateY(-2px);
            border-color: #c4c4c7;
            box-shadow: 
              0 1px 3px rgba(9, 9, 11, 0.02),
              0 16px 40px -8px rgba(9, 9, 11, 0.05),
              0 32px 80px -12px rgba(9, 9, 11, 0.08),
              inset 0 1px 0 0 rgba(255, 255, 255, 1);
          }
          .premium-card-dark {
            background: linear-gradient(145deg, #18181b 0%, #09090b 100%);
            border: 1px solid #27272a;
            box-shadow: 
              0 1px 2px rgba(0, 0, 0, 0.1),
              0 12px 36px -8px rgba(0, 0, 0, 0.25),
              inset 0 1px 0 0 rgba(255, 255, 255, 0.05);
            transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          }
          .premium-card-dark:hover {
            transform: translateY(-2px);
            border-color: #3f3f46;
            box-shadow: 
              0 1px 3px rgba(0, 0, 0, 0.15),
              0 24px 48px -10px rgba(0, 0, 0, 0.35),
              inset 0 1px 0 0 rgba(255, 255, 255, 0.08);
          }
          .premium-btn-primary {
            box-shadow: 
              0 1px 2px 0 rgba(0, 0, 0, 0.05),
              inset 0 1px 0 0 rgba(255, 255, 255, 0.2);
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          }
          .premium-btn-primary:active {
            transform: scale(0.98);
          }
          .premium-btn-secondary {
            background: #ffffff;
            border: 1px solid #d4d4d8;
            box-shadow: 
              0 1px 2px 0 rgba(9, 9, 11, 0.02),
              inset 0 1px 0 0 rgba(255, 255, 255, 0.8);
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          }
          .premium-btn-secondary:hover {
            background: #fafafa;
            border-color: #a1a1aa;
          }
          .premium-btn-secondary:active {
            transform: scale(0.98);
          }
          .premium-input {
            border: 1px solid #d4d4d8;
            background: #ffffff;
            box-shadow: 
              0 1px 2px 0 rgba(9, 9, 11, 0.02),
              inset 0 1px 2px 0 rgba(9, 9, 11, 0.02);
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          }
          .premium-input:focus {
            border-color: var(--brand-primary);
            box-shadow: 
              0 0 0 1px var(--brand-primary),
              0 1px 2px 0 rgba(9, 9, 11, 0.02);
          }
        `}</style>

        {/* 1. HEADER & NAVEGACIÓN GLOBAL */}
        <header className="sticky top-0 z-40 w-full border-b border-zinc-200/50 bg-white/70 backdrop-blur-md shadow-[0_1px_3px_0_rgba(9,9,11,0.02)]">
          {/* Enlaces superiores (sin fondo ni borde divisor) */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 flex items-center justify-end gap-4 text-[8px] font-mono uppercase tracking-widest text-zinc-400">
            <Link href={`/portal?tenant=${tenantCode}`} className="hover:text-zinc-800 transition-colors flex items-center gap-0.5">
              Portal Cliente <span className="text-[6px]">➔</span>
            </Link>
            <span className="opacity-15 select-none">•</span>
            <Link href={`/dashboard?tenant=${tenantCode}`} className="hover:text-zinc-800 transition-colors flex items-center gap-0.5">
              Portal ERP <span className="text-[6px]">➔</span>
            </Link>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {siteLogo ? (
                <img src={siteLogo} alt={siteName} className="h-8 w-auto object-contain" />
              ) : (
                <a href="#inicio" className="flex items-center gap-1.5 group">
                  <Wind className="w-4 h-4 text-zinc-900 transition-transform duration-500 group-hover:rotate-90" style={{ color: primaryColor }} />
                  <span className="text-[11px] font-black tracking-widest uppercase font-mono text-zinc-900">
                    {siteName}
                  </span>
                </a>
              )}
            </div>

            {/* Menú de Navegación con Separadores "+" */}
            <nav className="hidden md:flex items-center gap-3 text-[9px] font-mono uppercase">
              <a href="#inicio" className="text-zinc-500 hover:text-zinc-900 transition-colors font-bold tracking-wider">Inicio</a>
              <span className="text-zinc-300 font-light select-none">+</span>
              <a href="#sectores" className="text-zinc-500 hover:text-zinc-900 transition-colors font-bold tracking-wider">Sectores</a>
              <span className="text-zinc-300 font-light select-none">+</span>
              <a href="#problemas" className="text-zinc-500 hover:text-zinc-900 transition-colors font-bold tracking-wider">Problemas</a>
              <span className="text-zinc-300 font-light select-none">+</span>
              <a href="#servicios" className="text-zinc-500 hover:text-zinc-900 transition-colors font-bold tracking-wider">Servicios</a>
              <span className="text-zinc-300 font-light select-none">+</span>
              <a href="#proceso" className="text-zinc-500 hover:text-zinc-900 transition-colors font-bold tracking-wider">Proceso</a>
              <span className="text-zinc-300 font-light select-none">+</span>
              <a href="#proyectos" className="text-zinc-500 hover:text-zinc-900 transition-colors font-bold tracking-wider">Casos de Éxito</a>
              <span className="text-zinc-300 font-light select-none">+</span>
              <a href="#catalogo" className="text-zinc-500 hover:text-zinc-900 transition-colors font-bold tracking-wider">Catálogo Técnico</a>
              <span className="text-zinc-300 font-light select-none">+</span>
              <a href="#contacto" className="text-zinc-500 hover:text-zinc-900 transition-colors font-bold tracking-wider">Contacto</a>
            </nav>

            {/* Controles de Navegación */}
            <div className="flex items-center gap-3">
              <Link 
                href={`/wizard?tenant=${tenantCode}`}
                className="text-[8px] font-mono font-bold uppercase tracking-wider px-4.5 py-2 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white premium-btn-primary flex items-center gap-1 border border-zinc-900"
              >
                Diagnóstico <ArrowRight className="w-2.5 h-2.5" />
              </Link>
            </div>
          </div>
        </header>

      {/* 2. HERO SECTION (Inicio) */}
      <section id="inicio" className="relative w-full min-h-[90vh] flex items-center overflow-hidden bg-zinc-50 text-zinc-900 py-20 border-b border-zinc-200">
        {/* Background Video with Light Exposure Mask */}
        <div className="absolute inset-0 z-0 opacity-20">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover pointer-events-none filter contrast(1.1) brightness(1.2)"
          >
            <source src={branding.landing_video_url || "/video_hero.mp4"} type="video/mp4" />
          </video>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-50/95 via-zinc-50/80 to-transparent z-0 pointer-events-none" />

        {/* Technical mesh background overlay */}
        <div className="absolute inset-0 opacity-[0.04] z-0 pointer-events-none" style={{
          backgroundImage: "radial-gradient(circle, #000 1.5px, transparent 1.5px)",
          backgroundSize: "24px 24px"
        }} />

        {/* Technical Vector Lines & Rotating Elements (Urban Verge style) */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {/* Concentric rotating engineering circle (technical wireframe) */}
          <svg className="absolute right-[-5%] top-[-10%] w-[50%] h-[50%] opacity-10 animate-spin-slow text-zinc-950" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="0.1" strokeDasharray="1,2" />
            <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="0.2" />
            <circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="0.1" strokeDasharray="2,2" />
            <line x1="50" y1="5" x2="50" y2="95" stroke="currentColor" strokeWidth="0.1" strokeDasharray="2,2" />
            <line x1="5" y1="50" x2="95" y2="50" stroke="currentColor" strokeWidth="0.1" strokeDasharray="2,2" />
          </svg>
          {/* Fine technical drawing gridlines */}
          <div className="absolute left-[10%] top-0 bottom-0 w-[1px] bg-zinc-200/35" />
          <div className="absolute right-[25%] top-0 bottom-0 w-[1px] bg-zinc-200/35" />
          <div className="absolute top-[20%] left-0 right-0 h-[1px] bg-zinc-200/35" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full grid lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-8 text-left space-y-6">
            <span 
              className="text-[8px] font-mono uppercase tracking-widest px-2.5 py-1 rounded inline-block border bg-white/50 text-zinc-500 border-zinc-200/80 shadow-xs"
            >
              // INGENIERÍA AERODINÁMICA DE ALTO RENDIMIENTO
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tighter text-zinc-950 leading-none uppercase font-display">
              Garantizamos <span className="font-light text-zinc-400">la continuidad</span> operativa <span className="font-light text-zinc-400">de su planta</span>
            </h1>
            <p className="text-sm sm:text-base text-zinc-500 leading-relaxed max-w-2xl font-light normal-case font-sans">
              Diseñamos, fabricamos e implementamos sistemas integrales de ventilación industrial, extracción localizada y balanceo dinámico de precisión. Protegemos sus activos críticos, controlamos emisiones y optimizamos el consumo de potencia.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Link 
                href={`/wizard?tenant=${tenantCode}`}
                style={{ backgroundColor: primaryColor }}
                className="px-8 py-3.5 rounded-full font-mono font-bold text-[9px] uppercase tracking-widest text-white hover:brightness-110 active:scale-[0.98] transition-all premium-btn-primary flex items-center justify-center gap-2 border border-black/10 shadow-[0_4px_20px_-4px_rgba(2,132,199,0.3)] cursor-pointer"
              >
                Dimensionar Proyecto (Wizard B2B) <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <a 
                href="#catalogo"
                className="px-8 py-3.5 rounded-full border border-zinc-250 bg-white hover:bg-zinc-50 text-zinc-900 font-mono font-bold text-[9px] uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-2 premium-btn-secondary cursor-pointer"
              >
                Catálogo de Aplicaciones
              </a>
            </div>

            {/* Certifications Row */}
            <div className="pt-6 border-t border-zinc-200/60 flex flex-wrap items-center gap-8 opacity-90">
              <span className="text-[8px] font-mono uppercase tracking-widest text-zinc-400 font-bold">// CERTIFICADOS:</span>
              <div className="flex flex-wrap gap-3 text-[9px] font-mono text-zinc-650">
                <span className="px-2 py-0.5 border border-zinc-200 bg-white/60 rounded-md shadow-xs font-bold">✓ ISO 9001</span>
                <span className="px-2 py-0.5 border border-zinc-200 bg-white/60 rounded-md shadow-xs font-bold">✓ AMCA Standards</span>
                <span className="px-2 py-0.5 border border-zinc-200 bg-white/60 rounded-md shadow-xs font-bold">✓ ATEX Explosion-Proof</span>
                <span className="px-2 py-0.5 border border-zinc-200 bg-white/60 rounded-md shadow-xs font-bold">✓ Cumplimiento RETIE</span>
              </div>
            </div>
          </div>

          {/* Right Column: High density stats card with premium depth and technical detail */}
          <div className="lg:col-span-4 premium-card-light p-8 rounded-3xl space-y-6 bg-white/70 backdrop-blur-md border border-zinc-200/80">
            <h3 className="text-[9px] font-mono font-bold uppercase tracking-widest text-zinc-400 border-b border-zinc-150 pb-2 mb-4">// INDICADORES CLAVE (KPIs)</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 border border-zinc-200/65 bg-white/40 rounded-2xl shadow-xs">
                <span className="text-3xl font-black text-zinc-950 font-mono leading-none tracking-tight">99.8%</span>
                <div>
                  <h4 className="text-[9px] font-mono font-bold uppercase text-zinc-800 leading-none tracking-wider">// Disponibilidad</h4>
                  <p className="text-[9px] text-zinc-500 mt-1 normal-case leading-normal font-sans">Garantizada mediante redundancia aerodinámica en sitio.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 border border-zinc-200/65 bg-white/40 rounded-2xl shadow-xs">
                <span className="text-3xl font-black text-emerald-600 font-mono leading-none tracking-tight">-35%</span>
                <div>
                  <h4 className="text-[9px] font-mono font-bold uppercase text-zinc-800 leading-none tracking-wider">// Ahorro Energía</h4>
                  <p className="text-[9px] text-zinc-500 mt-1 normal-case leading-normal font-sans">Control por velocidad variable y álabes de alta eficiencia.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 border border-zinc-200/65 bg-white/40 rounded-2xl shadow-xs">
                <span className="text-3xl font-black text-zinc-950 font-mono leading-none tracking-tight">&gt;50k h</span>
                <div>
                  <h4 className="text-[9px] font-mono font-bold uppercase text-zinc-800 leading-none tracking-wider">// Vida Chumaceras</h4>
                  <p className="text-[9px] text-zinc-500 mt-1 normal-case leading-normal font-sans">Rodamientos SKF autoalineables bajo vibración controlada.</p>
                </div>
              </div>
            </div>

            {/* Representative clients */}
            <div className="pt-5 border-t border-zinc-150 space-y-3">
              <span className="text-[8px] font-mono uppercase tracking-widest text-zinc-400 block font-bold">// SOCIOS ESTRATÉGICOS B2B</span>
              <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-zinc-800">
                <span className="p-2 border border-zinc-200/60 bg-white/40 rounded-xl text-center hover:border-zinc-350 transition-colors shadow-xs">Cementos del Caribe</span>
                <span className="p-2 border border-zinc-200/60 bg-white/40 rounded-xl text-center hover:border-zinc-350 transition-colors shadow-xs">Acerías del Norte</span>
                <span className="p-2 border border-zinc-200/60 bg-white/40 rounded-xl text-center hover:border-zinc-350 transition-colors shadow-xs">Petroquímica S.A.</span>
                <span className="p-2 border border-zinc-200/60 bg-white/40 rounded-xl text-center hover:border-zinc-350 transition-colors shadow-xs">Minas de Carbón</span>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* SECTORES INDUSTRIALES */}
      <section id="sectores" className="py-20 bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-b pb-6 mb-12 border-zinc-200">
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-600">// COBERTURA OPERATIVA</span>
            <h2 className="text-3xl font-black uppercase mt-1 text-zinc-900 font-display">Sectores Industriales Críticos</h2>
            <p className="text-xs font-mono text-zinc-500 uppercase mt-2">
              Diseñamos sistemas que resisten las condiciones de severidad térmica y abrasión de la gran industria.
            </p>
          </div>

          {/* Asymmetric Grid Layout (City Arcade & Bauvorhaben inspiration) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {[
              { title: "Cemento y Clinker", desc: "Sistemas de extracción de polvo, hornos rotatorios y enfriamiento de clínker de alta abrasividad.", code: "SEC-CEM", colSpan: "md:col-span-4", num: "01" },
              { title: "Minería Subterránea", desc: "Ventilación de galerías, extracción de gases nocivos e inyección forzada con ductos de alta presión.", code: "SEC-MIN", colSpan: "md:col-span-4", num: "02" },
              { title: "Siderurgia y Fundición", desc: "Evacuación de humos de arco eléctrico, enfriamiento rápido de acero y disipación de alta carga térmica.", code: "SEC-SID", colSpan: "md:col-span-4", num: "03" },
              { title: "Procesos Químicos", desc: "Extractores con recubrimientos epóxicos y turbinas de acero inoxidable 316 para flujos corrosivos y atmósferas ATEX.", code: "SEC-QMC", colSpan: "md:col-span-6", num: "04" },
              { title: "Alimentos y Bebidas", desc: "Equipos de inyección limpia de aire filtrado con persianas de gravedad y chasis de aluminio naval grado alimenticio.", code: "SEC-ALI", colSpan: "md:col-span-6", num: "05" }
            ].map((sec, idx) => (
              <div key={idx} className={`p-8 premium-card-light rounded-3xl flex flex-col justify-between relative overflow-hidden group min-h-[220px] ${sec.colSpan}`}>
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-opacity schematic-grid" />
                <div className="relative z-10 space-y-4">
                  <span className="text-[8px] font-mono text-zinc-500 block font-bold tracking-widest bg-zinc-100 px-2.5 py-1 rounded w-fit border border-zinc-200">{sec.code}</span>
                  <h3 className="text-base font-black uppercase text-zinc-900 font-display tracking-tight pt-1">{sec.title}</h3>
                  <p className="text-[11px] text-zinc-500 leading-relaxed font-sans font-light normal-case max-w-md">{sec.desc}</p>
                </div>
                {/* Large architectural desaturated watermark number */}
                <div className="absolute right-4 bottom-[-10px] text-8xl font-black text-zinc-100/60 select-none pointer-events-none font-mono group-hover:text-zinc-200/50 transition-colors">
                  {sec.num}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEMAS QUE RESOLVEMOS */}
      <section id="problemas" className="py-20 bg-zinc-50 border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-b pb-6 mb-12 border-zinc-200">
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-600">// DIAGNÓSTICO EN PLANTA</span>
            <h2 className="text-3xl font-black uppercase mt-1 text-zinc-900 font-display">Problemas Industriales que Resolvemos</h2>
            <p className="text-xs font-mono text-zinc-500 uppercase mt-2">
              Evitamos sobrecostos y paradas mediante preingeniería correctiva.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                prob: "Estrangulamiento de Caudal por Caída de Presión",
                causa: "Ductos mal dimensionados o codos abruptos aumentan la contrapresión y fuerzan el motor.",
                solucion: "Rediseño fluidodinámico asistido por CFD y ventiladores centrífugos de álabes atrasados auto-limpiantes.",
                kpi: "Estabilización de flujo continuo y reducción del 25% en pérdida de carga aerodinámica.",
                id: "CASE_A"
              },
              {
                prob: "Parada de Línea de Producción por Fatiga Vibracional",
                causa: "Equipos mal balanceados transmiten vibraciones que destruyen chumaceras y desalinean el eje.",
                solucion: "Balanceo dinámico dual plano en campo bajo norma ISO 1940 a grado G2.5 con sensores ópticos láser.",
                kpi: "Incremento del tiempo medio entre fallos (MTBF) del rodamiento a más de 50,000 horas.",
                id: "CASE_B"
              },
              {
                prob: "Acumulación de Calor y Sofoco Térmico en Plantas",
                causa: "Maquinaria pesada eleva la temperatura ambiente > 38°C, reduciendo la productividad y violando normas de seguridad.",
                solucion: "Sistemas de renovación de aire forzada mediante extractores axiales con álabes perfil aerofoil.",
                kpi: "Disminución de hasta 8°C en zona operativa y cumplimiento del estándar HSEQ.",
                id: "CASE_C"
              },
              {
                prob: "Riesgo de Explosión por Atmósferas Inflamables",
                causa: "Acumulación de gases químicos o vapores inflamables sin equipos certificados.",
                solucion: "Sopladores centrífugos y extractores tubo-axiales con motor a prueba de explosión y turbinas antichispas ATEX.",
                kpi: "Mitigación del riesgo de ignición eléctrica/mecánica a cero bajo normas IEC/UL.",
                id: "CASE_D"
              }
            ].map((p, idx) => (
              <div key={idx} className="p-8 premium-card-light rounded-3xl flex flex-col justify-between hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none group-hover:opacity-[0.04] transition-opacity schematic-grid" />
                
                {/* Case watermark ID */}
                <div className="absolute right-6 top-6 text-xs font-mono text-zinc-300 font-bold opacity-40 select-none pointer-events-none">
                  //{p.id}
                </div>

                <div className="relative z-10 space-y-4">
                  <h3 className="text-sm font-black uppercase text-zinc-900 border-b border-zinc-200 pb-3 font-display tracking-tight flex items-center gap-2 pr-12">
                    <span className="text-red-500 font-mono">✕</span> {p.prob}
                  </h3>
                  <div className="space-y-3 text-[11px] font-sans text-zinc-700 leading-relaxed font-light normal-case">
                    <p className="flex gap-2"><strong className="text-zinc-900 font-bold shrink-0 font-mono">// CAUSA RAÍZ:</strong> <span className="text-zinc-500">{p.causa}</span></p>
                    <p className="flex gap-2"><strong className="text-zinc-900 font-bold shrink-0 font-mono">// SOLUCIÓN:</strong> <span className="text-zinc-500">{p.solucion}</span></p>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-[10px] font-mono text-emerald-800 shadow-[inset_0_1px_0_0_rgba(16,185,129,0.05)]">
                  <span className="font-bold block mb-1 text-emerald-700">// MEJORA COMPROBADA:</span> {p.kpi}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESO DE TRABAJO */}
      <section id="proceso" className="py-20 bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-b pb-6 mb-12 border-zinc-200">
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-600">// METODOLOGÍA B2B</span>
            <h2 className="text-3xl font-black uppercase mt-1 text-zinc-900 font-display">Ruta de Ejecución del Proyecto</h2>
            <p className="text-xs font-mono text-zinc-500 uppercase mt-2">
              Desde la toma de datos en planta hasta el comisionamiento técnico.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: "01", name: "Telemetría Inicial", desc: "Toma de mediciones físicas en sitio: velocidad de flujo, caída de presión con manómetros diferenciales y niveles de vibración espectral." },
              { step: "02", name: "Simulación CFD", desc: "Construcción de gemelos digitales tridimensionales del flujo de aire para simular pérdidas de carga y trayectorias térmicas antes de fabricar." },
              { step: "03", name: "Fabricación Especial", desc: "Mecanizado de turbinas y carcasas en acero estructural pesado con soldadura continua y balanceo dinámico de precisión en taller." },
              { step: "04", name: "Comisionamiento", desc: "Instalación en sitio, alineación láser de poleas, balanceo dinámico final a grado G2.5 y entrega de informe certificado de caudal." }
            ].map((prc, idx) => (
              <div key={idx} className="relative p-7 premium-card-light rounded-2xl overflow-hidden group">
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none group-hover:opacity-[0.04] transition-opacity schematic-grid" />
                <span className="text-5xl font-black text-zinc-200/50 font-mono absolute top-4 right-4 leading-none select-none group-hover:text-cyan-500/10 transition-colors">{prc.step}</span>
                <div className="relative z-10 space-y-3 pt-4">
                  <h3 className="text-sm font-black uppercase text-zinc-900 font-display tracking-tight">{prc.name}</h3>
                  <p className="text-xs text-zinc-650 leading-relaxed font-sans font-light normal-case">{prc.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. CATÁLOGO DE EQUIPOS (Alta Densidad) */}
      <section id="catalogo" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b pb-6 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4 border-current opacity-90">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest" style={{ color: primaryColor }}>// PRODUCTOS HOMOLOGADOS</span>
            <h2 className="text-3xl font-black uppercase mt-1">Catálogo de Equipos Industriales</h2>
          </div>
          <p className="text-xs font-mono text-zinc-500 uppercase max-w-md">
            Lista técnica de alta densidad de información estructurada bajo criterios operativos de caudal y contrapresión.
          </p>
        </div>

        <div className="w-full">
          {/* Listado Técnico: Grid de Spec Cards (Fichas Técnicas Resumidas) */}
          <div className="space-y-6">
            {filteredProducts.length === 0 ? (
              <div className="p-12 text-center rounded border border-dashed font-mono text-zinc-500 border-zinc-200">
                No se encontraron equipos configurados en el catálogo.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProducts.map((prod) => {
                  const isCompared = comparedProductIds.includes(prod.id);
                  return (
                    <div 
                      key={prod.id}
                      className="relative flex flex-col justify-between premium-card-light rounded-3xl overflow-hidden group border border-zinc-250 bg-white"
                    >
                      {/* Top Corner Badge & Status */}
                      <div className="absolute top-4 left-4 z-10">
                        <span className="px-2.5 py-1 font-mono text-[7px] font-bold uppercase tracking-widest bg-zinc-950 text-white rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.1)] border border-white/5">
                          {prod.badge}
                        </span>
                      </div>
                      <div className="absolute top-4 right-4 z-10">
                        <span className={`px-2.5 py-1 font-mono text-[7px] font-bold uppercase tracking-widest rounded-full shadow-xs border ${
                          prod.status.includes("inmediata") || prod.status.includes("Disponible")
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200/50"
                            : "bg-amber-50 text-amber-800 border-amber-200/50"
                        }`}>
                          {prod.status}
                        </span>
                      </div>

                      {/* 1. VISUAL AREA (approx 45% height): Image or vector rendering */}
                      <div className="w-full h-56 shrink-0 relative overflow-hidden bg-zinc-50 border-b border-zinc-200">
                        {/* Technical dimension line overlay (Stripe / Colbo style) */}
                        <div className="absolute inset-0 pointer-events-none opacity-30 z-10">
                          <div className="absolute bottom-4 left-10 right-10 h-[1px] bg-zinc-400 flex justify-between items-center px-1 text-[7px] font-mono text-zinc-500">
                            <span>|</span>
                            <span>Ø {prod.name.toLowerCase().includes("axial") ? "630" : "450"} mm</span>
                            <span>|</span>
                          </div>
                          <div className="absolute top-10 bottom-10 right-4 w-[1px] bg-zinc-400 flex flex-col justify-between items-center py-1 text-[7px] font-mono text-zinc-500">
                            <span>—</span>
                            <span className="rotate-90 origin-center text-center">H: {prod.name.toLowerCase().includes("axial") ? "320" : "780"} mm</span>
                            <span>—</span>
                          </div>
                        </div>

                        {prod.images && prod.images.length > 0 ? (
                          <img 
                            src={prod.images[0].filePath} 
                            alt={prod.images[0].altText || prod.name} 
                            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700" 
                          />
                        ) : (
                          // Fallback: spinning SVG wireframe on light schematic grid
                          <div className="w-full h-full flex items-center justify-center relative overflow-hidden bg-zinc-50">
                            <div className="absolute inset-0 opacity-[0.03] pointer-events-none group-hover:opacity-[0.06] transition-opacity schematic-grid" />
                            
                            <svg 
                              className="w-20 h-20 text-zinc-300 relative transition-transform duration-700 group-hover:rotate-180" 
                              viewBox="0 0 100 100" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="0.75"
                            >
                              <circle cx="50" cy="50" r="45" strokeDasharray="2 2" stroke="currentColor" className="opacity-40" />
                              <circle cx="50" cy="50" r="30" stroke="currentColor" className="opacity-60" />
                              <circle cx="50" cy="50" r="10" />
                              
                              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                                <path 
                                  key={deg} 
                                  d="M 50 50 Q 65 32 72 42" 
                                  transform={`rotate(${deg} 50 50)`}
                                  strokeWidth="1.25"
                                  style={{ color: primaryColor, opacity: 0.6 }}
                                />
                              ))}
                              <circle cx="50" cy="50" r="2.5" fill="currentColor" />
                            </svg>
                            
                            <div className="absolute bottom-2 left-3 right-3 flex justify-between font-mono text-[7px] text-zinc-400 uppercase tracking-widest pointer-events-none">
                              <span>// schematic.3d</span>
                              <span>{prod.familyName}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 2. CARD CONTENT */}
                      <div className="p-8 flex-1 flex flex-col justify-between gap-6">
                        {/* Title Section */}
                        <div className="space-y-1">
                          <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-widest block font-bold">
                            SKU: {prod.sku}
                          </span>
                          <h3 className="text-lg font-black text-zinc-950 tracking-tight leading-tight font-display">
                            {prod.name}
                          </h3>
                          <div className="text-[9px] font-mono tracking-widest uppercase font-bold" style={{ color: primaryColor }}>
                            {prod.subtitle}
                          </div>
                          
                          {/* Rich B2B Application Specifications */}
                          <div className="mt-6 space-y-4 border-t border-zinc-200/60 pt-4 text-xs text-zinc-600 leading-relaxed font-sans font-light normal-case">
                            <div>
                              <strong className="text-zinc-900 block font-mono text-[8px] uppercase tracking-widest font-bold mb-1">// PROPÓSITO GENERAL:</strong>
                              <span className="text-[11px] text-zinc-500">{prod.description}</span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <strong className="text-zinc-900 block font-mono text-[7px] uppercase tracking-widest font-bold mb-1">PROBLEMA QUE CORRIGE:</strong>
                                <span className="text-[10px] leading-normal text-zinc-500 block">
                                  {prod.name.toLowerCase().includes("centrífugo") || prod.name.toLowerCase().includes("blower") || prod.name.toLowerCase().includes("hongo")
                                    ? "Concentración de contaminantes pesados y alta caída estática"
                                    : prod.name.toLowerCase().includes("axial")
                                      ? "Estrangulamiento de flujo de aire y estancamiento de calor"
                                      : "Sofoco generalizado y renovación ineficiente de volumen"}
                                </span>
                              </div>
                              
                              <div>
                                <strong className="text-zinc-900 block font-mono text-[7px] uppercase tracking-widest font-bold mb-1">ÁREA DE MONTAJE:</strong>
                                <span className="text-[10px] leading-normal text-zinc-500 block">
                                  {prod.name.toLowerCase().includes("centrífugo") || prod.name.toLowerCase().includes("blower")
                                    ? "Salidas de tolvas, ciclones, hornos y plantas de fundición"
                                    : prod.name.toLowerCase().includes("hongo")
                                      ? "Techos de naves industriales, almacenes y salas de calderas"
                                      : "Instalación en ductos axiales de sótanos y túneles"}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 border-t border-zinc-200/60 pt-3 font-mono text-[10px]">
                              <div>
                                <strong className="text-zinc-900 block text-[7px] uppercase tracking-widest font-bold mb-1">CAPACIDAD NOMINAL:</strong>
                                <span className="font-bold text-zinc-950">{prod.caudalVal} | {prod.presionVal}</span>
                              </div>
                              
                              <div>
                                <strong className="text-zinc-900 block text-[7px] uppercase tracking-widest font-bold mb-1">CERTIFICACIÓN INDUSTRIAL:</strong>
                                <span className="font-bold text-zinc-950">{prod.certificaciones.slice(0, 2).join(", ")}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 3. ACTION FOOTER */}
                        <div className="border-t border-zinc-200/60 pt-5 flex items-center justify-between font-mono text-[9px] tracking-wider">
                          <button
                            onClick={() => setActiveProductDetails(prod)}
                            className="font-bold text-zinc-950 hover:text-cyan-600 flex items-center gap-1 transition-colors cursor-pointer group/link uppercase"
                          >
                            Ficha Técnica <span className="transform group-hover/link:translate-x-0.5 transition-transform">➔</span>
                          </button>

                          <div className="flex items-center gap-3.5">
                            {/* Simple inline compare toggle */}
                            <label className="flex items-center gap-1 cursor-pointer text-zinc-400 hover:text-zinc-800 transition-colors select-none text-[9px] font-bold">
                              <input 
                                type="checkbox"
                                checked={isCompared}
                                onChange={() => {
                                  if (isCompared) {
                                    setComparedProductIds(prev => prev.filter(id => id !== prod.id));
                                  } else {
                                    if (comparedProductIds.length >= 3) {
                                      alert("Máximo 3 equipos para comparación.");
                                      return;
                                    }
                                    setComparedProductIds(prev => [...prev, prod.id]);
                                  }
                                }}
                                className="rounded border-zinc-300 text-cyan-600 focus:ring-cyan-500 h-3 w-3 cursor-pointer"
                              />
                              <span>Comparar</span>
                            </label>
                            
                            <Link
                              href={`/wizard?tenant=${tenantCode}&product=${prod.id}`}
                              className="font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full bg-zinc-950 hover:bg-zinc-850 text-white transition-colors flex items-center gap-0.5"
                            >
                              Cotizar ↗
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. INGENIERÍA Y SERVICIOS */}
      <section id="servicios" className="py-20 bg-zinc-50 border-y border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-b pb-6 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4 border-zinc-200 opacity-90">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-cyan-600">// SOPORTE DE OPERACIÓN</span>
              <h2 className="text-3xl font-black uppercase mt-1 text-zinc-900">Ingeniería y Servicios Especializados</h2>
            </div>
            <p className="text-xs font-mono text-zinc-500 uppercase max-w-md">
              Capacidades de corrección y diagnóstico aerodinámico in-situ bajo protocolos normalizados.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((srv, idx) => (
              <div 
                key={idx}
                className="p-8 premium-card-light rounded-2xl flex flex-col justify-between group relative overflow-hidden"
              >
                <div className="absolute inset-0 opacity-[0.01] pointer-events-none group-hover:opacity-[0.03] transition-opacity schematic-grid" />
                <div className="relative z-10">
                  <div className="p-3.5 w-fit rounded-xl mb-6 bg-zinc-50 border border-zinc-150 group-hover:bg-cyan-500/10 group-hover:border-cyan-500/20 transition-all duration-300">
                    {srv.icon}
                  </div>
                  <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block font-bold mb-2">{srv.code}</span>
                  <h3 className="text-base font-black uppercase mb-3 text-zinc-950 group-hover:text-cyan-600 transition-colors tracking-tight">{srv.title}</h3>
                  <p className="text-xs text-zinc-650 leading-relaxed font-sans font-light normal-case">{srv.description}</p>
                </div>

                <a 
                  href="#contacto"
                  onClick={() => setFormData(prev => ({ ...prev, description: `Solicito visita técnica para servicio: ${srv.title}` }))}
                  className="mt-8 text-[10px] font-mono font-bold text-cyan-600 hover:text-cyan-700 flex items-center gap-1.5 uppercase tracking-wider relative z-10"
                >
                  Agendar Visita <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. CASOS DE ÉXITO Y PROYECTOS CLAVE */}
      <section id="proyectos" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-white">
        <div className="border-b pb-6 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4 border-zinc-200 opacity-90">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-600">// RENDIMIENTO VERIFICABLE</span>
            <h2 className="text-3xl font-black uppercase mt-1 text-zinc-900">Casos de Éxito y Proyectos Clave</h2>
          </div>
          <p className="text-xs font-mono text-zinc-500 uppercase max-w-md">
            Soluciones aplicadas a escenarios de severidad operativa y flujos de trabajo de alta ingeniería.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {caseStudies.map((cs) => (
            <div 
              key={cs.id}
              className="p-8 premium-card-light rounded-2xl flex flex-col justify-between group relative overflow-hidden"
            >
              <div className="absolute inset-0 opacity-[0.01] pointer-events-none group-hover:opacity-[0.03] transition-opacity schematic-grid" />
              <div className="relative z-10">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-5">
                  <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest font-bold">{cs.client}</span>
                  <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200 font-bold">{cs.id}</span>
                </div>
                <h3 className="text-lg font-black uppercase mb-3 text-zinc-950 tracking-tight">{cs.title}</h3>
                <p className="text-xs text-zinc-650 leading-relaxed mb-6 font-sans font-light normal-case">{cs.description}</p>
                
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl font-mono text-[9px] uppercase tracking-widest text-emerald-800 shadow-[inset_0_1px_0_0_rgba(16,185,129,0.05)]">
                  <span className="font-bold text-emerald-950 block mb-1.5">// MÉTRICAS COMPROBADAS EN PLANTA:</span>
                  {cs.metrics}
                </div>
              </div>

              <button
                onClick={() => setActiveCaseStudy(cs.id)}
                className="mt-6 w-full py-3.5 bg-zinc-950 text-white hover:bg-zinc-850 text-[10px] font-mono font-bold uppercase tracking-widest transition-all rounded-lg cursor-pointer text-center border border-zinc-900 premium-btn-primary relative z-10"
              >
                Analizar Caso Completo ➔
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 6. EMPRESA (Capacidad y Operación) */}
      <section id="empresa" className="py-20 bg-zinc-50 border-y border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          {/* Header */}
          <div className="border-b pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 border-zinc-200">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest" style={{ color: primaryColor }}>// CAPACIDAD OPERATIVA</span>
              <h2 className="text-3xl font-black uppercase mt-1 text-zinc-900">Evolución y Cumplimiento Técnico</h2>
            </div>
            <p className="text-xs font-mono text-zinc-500 uppercase max-w-md">
              Estructura estratégica, infraestructura de taller metalmecánico pesada e historia corporativa.
            </p>
          </div>

          {/* Misión and Visión Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Misión */}
            <div className="premium-card-light p-8 rounded-2xl space-y-4 hover:shadow-lg transition-all duration-350 relative overflow-hidden group">
              <div className="absolute inset-0 opacity-[0.01] pointer-events-none group-hover:opacity-[0.03] transition-opacity schematic-grid" />
              <div className="flex items-center gap-3 relative z-10" style={{ color: primaryColor }}>
                <Target className="h-6 w-6" />
                <h3 className="font-sans font-black text-2xl uppercase tracking-tight text-zinc-950">Nuestra Misión B2B</h3>
              </div>
              <p className="text-xs text-zinc-650 leading-relaxed normal-case font-sans font-light relative z-10">
                Asegurar la continuidad operativa de la gran industria del Caribe y el continente latinoamericano a través del suministro, fabricación y diagnóstico predictivo de unidades de flujo de aire de alta capacidad, optimizando el consumo energético y garantizando la total seguridad laboral y ambiental en entornos críticos.
              </p>
            </div>

            {/* Visión */}
            <div className="premium-card-light p-8 rounded-2xl space-y-4 hover:shadow-lg transition-all duration-350 relative overflow-hidden group">
              <div className="absolute inset-0 opacity-[0.01] pointer-events-none group-hover:opacity-[0.03] transition-opacity schematic-grid" />
              <div className="flex items-center gap-3 relative z-10" style={{ color: primaryColor }}>
                <Award className="h-6 w-6" />
                <h3 className="font-sans font-black text-2xl uppercase tracking-tight text-zinc-950">Visión de Ingeniería</h3>
              </div>
              <p className="text-xs text-zinc-650 leading-relaxed normal-case font-sans font-light relative z-10">
                Consolidarnos para el 2030 como el principal fabricante y comisionador tecnológico de sistemas de ventilación forzada e inyección en el norte de Sudamérica y Centroamérica, liderando la transición hacia la ventilación inteligente basada en telemetría de vibración computacional en la nube.
              </p>
            </div>
          </div>

          {/* Interactive Tabs for Capacidades, Certificaciones and HSEQ */}
          <div className="premium-card-light p-8 rounded-2xl space-y-8 relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.01] pointer-events-none schematic-grid" />
            {/* Tabs header list */}
            <div className="flex border-b border-zinc-150 pb-3 gap-6 overflow-x-auto relative z-10">
              <button
                type="button"
                onClick={() => setActiveEmpresaTab("capacidades")}
                className="font-mono text-xs uppercase tracking-widest pb-2 px-1 transition-all whitespace-nowrap cursor-pointer border-b-2 font-bold"
                style={{
                  color: activeEmpresaTab === "capacidades" ? primaryColor : "#71717a",
                  borderColor: activeEmpresaTab === "capacidades" ? primaryColor : "transparent"
                }}
              >
                [+] Capacidades Industriales
              </button>
              
              <button
                type="button"
                onClick={() => setActiveEmpresaTab("certificaciones")}
                className="font-mono text-xs uppercase tracking-widest pb-2 px-1 transition-all whitespace-nowrap cursor-pointer border-b-2 font-bold"
                style={{
                  color: activeEmpresaTab === "certificaciones" ? primaryColor : "#71717a",
                  borderColor: activeEmpresaTab === "certificaciones" ? primaryColor : "transparent"
                }}
              >
                [+] Certificaciones Colombia
              </button>
              
              <button
                type="button"
                onClick={() => setActiveEmpresaTab("seguridad")}
                className="font-mono text-xs uppercase tracking-widest pb-2 px-1 transition-all whitespace-nowrap cursor-pointer border-b-2 font-bold"
                style={{
                  color: activeEmpresaTab === "seguridad" ? primaryColor : "#71717a",
                  borderColor: activeEmpresaTab === "seguridad" ? primaryColor : "transparent"
                }}
              >
                [+] Seguridad Industrial & HSEQ
              </button>
            </div>

            {/* Dynamic Content render */}
            <div className="min-h-[220px]">
              {activeEmpresaTab === "capacidades" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="font-sans font-bold text-lg text-zinc-900 uppercase">
                      Taller Mecánico en Vía 40, Barranquilla
                    </h4>
                    <p className="text-xs text-zinc-650 leading-relaxed font-sans normal-case">
                      Contamos con una planta industrial propia de 2,400 m² equipada con maquinaria de precisión CNC pesada para el corte y rolado de lámina de acero hasta calibre 3/8”, balanceadoras dinámicas de banco calibradas bajo normas ISO, y laboratorios de pruebas aerodinámicas con túnel de viento instrumentado.
                    </p>
                    <div className="flex items-center gap-2 font-mono text-[10px] uppercase" style={{ color: primaryColor }}>
                      <MapPin className="h-4 w-4" /> Ubi: Zona Industrial Vía 40, Atlántico
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h5 className="font-mono text-[9px] text-zinc-400 uppercase tracking-wider font-bold">
                      VECTOR DE CAPACIDADES CLAVE:
                    </h5>
                    <ul className="space-y-2 text-xs text-zinc-700 font-mono">
                      <li className="flex items-center gap-2">
                        <span className="text-emerald-500 font-bold">[✓]</span>
                        <span>Balanceo dinámico in-situ y en banco hasta 5 toneladas.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-emerald-500 font-bold">[✓]</span>
                        <span>Soldadores homologados ASME Sección IX.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-emerald-500 font-bold">[✓]</span>
                        <span>Modelado fluidodinámico computacional CFD interno.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-emerald-500 font-bold">[✓]</span>
                        <span>Comisionamiento y alineación láser portátil.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {activeEmpresaTab === "certificaciones" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="font-sans font-bold text-lg text-zinc-900 uppercase">
                      Garantía de Calidad y Cumplimiento Normativo
                    </h4>
                    <p className="text-xs text-zinc-650 leading-relaxed font-sans normal-case">
                      Nuestros procesos operativos y de ingeniería están completamente auditados y certificados por organismos reguladores nacionales, garantizando que cada impulsor fabricado cumpla estrictamente con la reglamentación eléctrica y de seguridad nacional.
                    </p>
                  </div>

                  <div className="space-y-3 font-mono text-[10px] text-zinc-650">
                    <div className="flex items-start gap-2.5 p-3.5 bg-zinc-50 border border-zinc-150 rounded-sm">
                      <ShieldCheck className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-zinc-900 font-bold block uppercase">RETIE / NTC 2050 (Colombia)</span>
                        <p className="text-[9px] text-zinc-500 normal-case leading-normal mt-1">
                          Cumplimiento obligatorio en el cableado, megado de motores y acometidas de fuerza de todos nuestros equipos instalados.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-3.5 bg-zinc-50 border border-zinc-150 rounded-sm">
                      <FileCheck className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: primaryColor }} />
                      <div>
                        <span className="text-zinc-900 font-bold block uppercase">ISO 9001:2015 Certificado</span>
                        <p className="text-[9px] text-zinc-500 normal-case leading-normal mt-1">
                          Certificado internacional de gestión de calidad en los procesos de cálculo de ingeniería, compras de material y soldadura.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeEmpresaTab === "seguridad" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="font-sans font-bold text-lg text-zinc-900 uppercase">
                      Cultura de Cero Accidentes HSEQ
                    </h4>
                    <p className="text-xs text-zinc-650 leading-relaxed font-sans normal-case">
                      Priorizamos la vida humana sobre cualquier factor productivo. Toda intervención en sitio de nuestro personal de campo cuenta con protocolos estrictos de bloqueo de energías (LOTO), análisis de trabajo seguro (ATS) y el debido cumplimiento de las resoluciones de seguridad vigentes en Colombia.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h5 className="font-mono text-[9px] text-zinc-400 uppercase tracking-wider font-bold">
                      POLÍTICA Y NORMAS APLICADAS DE CAMPO:
                    </h5>
                    <ul className="space-y-2 text-xs text-zinc-700 font-mono">
                      <li className="flex items-center gap-2">
                        <span className="font-bold" style={{ color: primaryColor }}>[▶]</span>
                        <span>ISO 45001:2018 (Seguridad y Salud en el Trabajo).</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="font-bold" style={{ color: primaryColor }}>[▶]</span>
                        <span>Resolución 5018 de MinTrabajo (Seguridad en instalaciones eléctricas).</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="font-bold" style={{ color: primaryColor }}>[▶]</span>
                        <span>Coordinadores de alturas certificados bajo Resolución 4272.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="font-bold" style={{ color: primaryColor }}>[▶]</span>
                        <span>Protocolo LOTO de bloqueo mecánico y eléctrico estricto en plantas.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Trayectoria del Grupo / Timeline Section */}
          <div className="space-y-8 pt-8">
            <div className="space-y-2 text-center max-w-xl mx-auto">
              <span className="font-mono text-[10px] tracking-widest uppercase font-bold" style={{ color: primaryColor }}>HISTORIA COHERENTE</span>
              <h3 className="font-sans font-bold text-2xl text-zinc-900 uppercase">Trayectoria del Grupo</h3>
              <p className="text-xs text-zinc-500 normal-case leading-relaxed font-sans">
                Consistencia absoluta y madurez B2B a lo largo de una década de ingeniería de flujo y mantenimiento predictivo en Colombia.
              </p>
            </div>

            <div className="relative border-l border-zinc-200 max-w-2xl mx-auto pl-6 md:pl-8 space-y-12">
              {/* Milestone 2015 */}
              <div className="relative group">
                <div className="absolute -left-[31px] md:-left-[39px] top-1 h-4 w-4 rounded-full border bg-white flex items-center justify-center transition-all group-hover:scale-110" style={{ borderColor: primaryColor }}>
                  <span className="h-1.5 w-1.5 rounded-full transition-transform group-hover:scale-125" style={{ backgroundColor: primaryColor }}></span>
                </div>
                
                <div className="space-y-2">
                  <span className="font-mono text-xs font-bold border px-2 py-0.5 rounded-sm" style={{ color: primaryColor, backgroundColor: `${primaryColor}0c`, borderColor: `${primaryColor}33` }}>
                    2015
                  </span>
                  <h4 className="font-sans font-bold text-base text-zinc-900 uppercase">
                    Fundación y Taller Local
                  </h4>
                  <p className="text-xs text-zinc-600 leading-relaxed font-sans normal-case max-w-xl">
                    Apertura del primer centro de mantenimiento de rotores y ventiladores en Barranquilla, atendiendo la zona franca y puertos locales.
                  </p>
                </div>
              </div>

              {/* Milestone 2018 */}
              <div className="relative group">
                <div className="absolute -left-[31px] md:-left-[39px] top-1 h-4 w-4 rounded-full border bg-white flex items-center justify-center transition-all group-hover:scale-110" style={{ borderColor: primaryColor }}>
                  <span className="h-1.5 w-1.5 rounded-full transition-transform group-hover:scale-125" style={{ backgroundColor: primaryColor }}></span>
                </div>
                
                <div className="space-y-2">
                  <span className="font-mono text-xs font-bold border px-2 py-0.5 rounded-sm" style={{ color: primaryColor, backgroundColor: `${primaryColor}0c`, borderColor: `${primaryColor}33` }}>
                    2018
                  </span>
                  <h4 className="font-sans font-bold text-base text-zinc-900 uppercase">
                    Expansión Metalmecánica B2B
                  </h4>
                  <p className="text-xs text-zinc-600 leading-relaxed font-sans normal-case max-w-xl">
                    Inversión en maquinaria de corte láser CNC de gran escala y hornos de forja, permitiendo iniciar la fabricación de volutas y extractores centrífugos propios.
                  </p>
                </div>
              </div>

              {/* Milestone 2021 */}
              <div className="relative group">
                <div className="absolute -left-[31px] md:-left-[39px] top-1 h-4 w-4 rounded-full border bg-white flex items-center justify-center transition-all group-hover:scale-110" style={{ borderColor: primaryColor }}>
                  <span className="h-1.5 w-1.5 rounded-full transition-transform group-hover:scale-125" style={{ backgroundColor: primaryColor }}></span>
                </div>
                
                <div className="space-y-2">
                  <span className="font-mono text-xs font-bold border px-2 py-0.5 rounded-sm" style={{ color: primaryColor, backgroundColor: `${primaryColor}0c`, borderColor: `${primaryColor}33` }}>
                    2021
                  </span>
                  <h4 className="font-sans font-bold text-base text-zinc-900 uppercase">
                    Certificación HSEQ & Acreditación Nacional
                  </h4>
                  <p className="text-xs text-zinc-600 leading-relaxed font-sans normal-case max-w-xl">
                    Obtención de la certificación ISO 9001 de gestión de calidad e ISO 45001 de seguridad en el trabajo, consolidando la operación con cementeras y mineras.
                  </p>
                </div>
              </div>

              {/* Milestone 2024 */}
              <div className="relative group">
                <div className="absolute -left-[31px] md:-left-[39px] top-1 h-4 w-4 rounded-full border bg-white flex items-center justify-center transition-all group-hover:scale-110" style={{ borderColor: primaryColor }}>
                  <span className="h-1.5 w-1.5 rounded-full transition-transform group-hover:scale-125" style={{ backgroundColor: primaryColor }}></span>
                </div>
                
                <div className="space-y-2">
                  <span className="font-mono text-xs font-bold border px-2 py-0.5 rounded-sm" style={{ color: primaryColor, backgroundColor: `${primaryColor}0c`, borderColor: `${primaryColor}33` }}>
                    2024
                  </span>
                  <h4 className="font-sans font-bold text-base text-zinc-900 uppercase">
                    Lanzamiento de VENTITECH OS
                  </h4>
                  <p className="text-xs text-zinc-600 leading-relaxed font-sans normal-case max-w-xl">
                    Digitalización de la preingeniería termodinámica y el dimensionamiento de ventilación, permitiendo cotizaciones computacionales de alta velocidad y diagnósticos B2B.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Dossier & Videoconference Technical CTA */}
          <div className="premium-card-dark p-8 md:p-12 rounded-2xl flex flex-col lg:flex-row items-center justify-between gap-8 backdrop-blur-md border border-zinc-800">
            <div className="space-y-3 max-w-2xl text-left">
              <span className="text-[9px] font-mono uppercase tracking-widest block font-bold" style={{ color: primaryColor }}>// CONSULTAR CAPACIDAD INSTALADA</span>
              <h4 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white font-display">¿Requiere consultar nuestra capacidad instalada?</h4>
              <p className="text-xs text-zinc-400 leading-relaxed font-mono uppercase tracking-widest font-light normal-case">
                Descargue nuestro dossier corporativo digital o agende una videoconferencia técnica con un ingeniero especialista de proyectos residiendo en Barranquilla.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto shrink-0 font-mono">
              <a
                href="#contacto"
                className="px-6 py-4 border border-white/15 bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-widest text-center transition-all active:scale-[0.98] rounded-lg backdrop-blur-md cursor-pointer"
              >
                Contactar Oficina B2B
              </a>
              <Link
                href={`/wizard?tenant=${tenantCode}`}
                className="px-6 py-4 text-white font-bold text-xs uppercase tracking-widest text-center transition-all active:scale-[0.98] rounded-lg premium-btn-primary cursor-pointer border border-black/15 shadow-[0_4px_20px_-4px_rgba(2,132,199,0.4)]"
                style={{ backgroundColor: primaryColor }}
              >
                Dimensionar Proyecto
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 7. CONTACTO B2B */}
      <section id="contacto" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b pb-6 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4 border-current opacity-90">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest" style={{ color: primaryColor }}>// COMUNICACIÓN CORPORATIVA</span>
            <h2 className="text-3xl font-black uppercase mt-1">Recepción de Ingeniería</h2>
          </div>
          <p className="text-xs font-mono text-zinc-500 uppercase max-w-md">
            Consigne sus requerimientos técnicos. Un ingeniero de guardia responderá en un plazo máximo de 4 horas hábiles.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Datos y Mapa */}
          <div className="lg:col-span-5 space-y-8 uppercase font-mono text-xs">
            <div>
              <h3 className="font-bold border-b pb-2 mb-4 border-current/15 tracking-wider">OFICINA CENTRAL</h3>
              <div className="space-y-4 text-zinc-500 tracking-wider">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5" style={{ color: primaryColor }} />
                  <span>Cra 38 #51-88, Barranquilla, Atlántico.</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 shrink-0" style={{ color: primaryColor }} />
                  <span>301 335 3243 - 302 307 4143</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 shrink-0" style={{ color: primaryColor }} />
                  <span className="lowercase">ahventusin@gmail.com</span>
                </div>
              </div>
            </div>

            {/* Google Map In Grayscale/Dark mode overlay style */}
            <div className="w-full h-72 rounded border border-zinc-800 overflow-hidden relative">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3916.634125867156!2d-74.80735342417774!3d10.991196155186532!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8ef42d650117d7ad%3A0xe54d24176378e9f2!2sCra.%2038%20%2351-88%2C%20Sur%20Oriente%2C%20Barranquilla%2C%20Atl%C3%A1ntico!5e0!3m2!1ses-419!2sco!4v1716335324300!5m2!1ses-419!2sco"
                width="100%"
                height="100%"
                style={{ 
                  border: 0, 
                  filter: "grayscale(1) contrast(1.1) brightness(0.95)" 
                }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          {/* Formulario */}
          <div className="lg:col-span-7">
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[8px] font-mono uppercase tracking-widest mb-1 text-zinc-400 font-bold">// Nombre Contacto</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-transparent border-0 border-b border-zinc-200 focus:border-zinc-950 px-0 py-2.5 text-zinc-900 text-sm focus:ring-0 focus:outline-none transition-colors font-medium rounded-none placeholder-zinc-300"
                    placeholder="Ej. Ing. Carlos Mendoza"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-mono uppercase tracking-widest mb-1 text-zinc-400 font-bold">// Empresa / Razón Social</label>
                  <input 
                    type="text" 
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                    className="w-full bg-transparent border-0 border-b border-zinc-200 focus:border-zinc-950 px-0 py-2.5 text-zinc-900 text-sm focus:ring-0 focus:outline-none transition-colors font-medium rounded-none placeholder-zinc-300"
                    placeholder="Ej. Cementos del Norte S.A."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[8px] font-mono uppercase tracking-widest mb-1 text-zinc-400 font-bold">// Teléfono Móvil</label>
                  <input 
                    type="tel" 
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-transparent border-0 border-b border-zinc-200 focus:border-zinc-950 px-0 py-2.5 text-zinc-900 text-sm focus:ring-0 focus:outline-none transition-colors font-medium rounded-none placeholder-zinc-300"
                    placeholder="Ej. 3013353243"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-mono uppercase tracking-widest mb-1 text-zinc-400 font-bold">// Correo Corporativo</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-transparent border-0 border-b border-zinc-200 focus:border-zinc-950 px-0 py-2.5 text-zinc-900 text-sm focus:ring-0 focus:outline-none transition-colors font-medium rounded-none placeholder-zinc-300"
                    placeholder="carlos.mendoza@empresa.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[8px] font-mono uppercase tracking-widest mb-1 text-zinc-400 font-bold">// Urgencia Operativa</label>
                <select
                  value={formData.urgency}
                  onChange={(e) => setFormData(prev => ({ ...prev, urgency: e.target.value }))}
                  className="w-full bg-transparent border-0 border-b border-zinc-200 focus:border-zinc-950 px-0 py-2.5 text-zinc-900 text-sm focus:ring-0 focus:outline-none transition-colors font-medium rounded-none cursor-pointer"
                >
                  <option value="baja">Baja — Planificación Preventiva</option>
                  <option value="media">Media — Modernización / Programada</option>
                  <option value="alta">Alta / Crítica — Falla de Planta / Parada de Línea</option>
                </select>
              </div>

              <div>
                <label className="block text-[8px] font-mono uppercase tracking-widest mb-1 text-zinc-400 font-bold">// Descripción del Requerimiento Técnico</label>
                <textarea 
                  rows={3}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-transparent border-0 border-b border-zinc-200 focus:border-zinc-950 px-0 py-2 text-zinc-900 text-sm focus:ring-0 focus:outline-none transition-colors font-medium rounded-none placeholder-zinc-300 resize-none"
                  placeholder="Detalle caudales requeridos (CFM), contrapresiones (in w.g.), temperatura o condiciones de severidad del aire."
                />
              </div>

              {submitError && (
                <div className="p-4 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-mono">
                  {submitError}
                </div>
              )}

              {submitSuccess && (
                <div className="p-4 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-mono flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>SOLICITUD ENVIADA CON ÉXITO. UN INGENIERO SE PONDRÁ EN CONTACTO.</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                style={{ backgroundColor: primaryColor }}
                className="w-full py-4 rounded-full font-mono font-bold text-[10px] uppercase tracking-widest text-white hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-55 cursor-pointer premium-btn-primary border border-black/10 shadow-[0_4px_20px_-4px_rgba(2,132,199,0.3)]"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Procesando Solicitud...
                  </>
                ) : (
                  "ENVIAR SOLICITUD DE INGENIERÍA ↗"
                )}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="pt-16 pb-8 border-t font-mono text-[9px] uppercase tracking-wider bg-zinc-50 border-zinc-200 text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="space-y-2 md:border-r border-zinc-200/60 pr-4">
            <span className="font-bold text-zinc-800 block mb-3">// COMPAÑÍA</span>
            <p className="text-zinc-500 normal-case leading-relaxed">Cra 38 #51-88, Barranquilla, Atlántico. Diseños aerodinámicos de alta eficiencia y continuidad de planta.</p>
          </div>
          <div className="space-y-2 md:border-r border-zinc-200/60 pr-4">
            <span className="font-bold text-zinc-800 block mb-3">// HOMOLOGACIÓN</span>
            <p className="text-zinc-500 leading-relaxed">AMCA member standard, ASHRAE active member, RETIE certified designs, NTC 2050 electrical compliance.</p>
          </div>
          <div className="space-y-2 md:border-r border-zinc-200/60 pr-4">
            <span className="font-bold text-zinc-800 block mb-3">// ACCESOS</span>
            <div className="flex flex-col gap-1.5">
              <Link href={`/portal?tenant=${tenantCode}`} className="hover:text-zinc-950 transition-colors">➔ Portal Clientes B2B</Link>
              <Link href={`/dashboard?tenant=${tenantCode}`} className="hover:text-zinc-950 transition-colors">➔ Administración ERP</Link>
            </div>
          </div>
          <div className="space-y-2">
            <span className="font-bold text-zinc-800 block mb-3">// SERVICIO TÉCNICO</span>
            <p className="text-zinc-500 leading-relaxed">Ingeniero especialista de guardia. Tiempo de respuesta promedio en portal: &lt; 4 horas hábiles.</p>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-zinc-200/60 pt-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-[40px] sm:text-[70px] lg:text-[110px] font-black text-zinc-150/50 tracking-[0.2em] select-none pointer-events-none font-display w-full text-center leading-none my-4 uppercase">
            {siteName}
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[8px] text-zinc-400">
          <span>© 2026 {siteName.toUpperCase()}. TODOS LOS DERECHOS RESERVADOS.</span>
          <span>DISEÑO DE INGENIERÍA HOMOLOGADO</span>
        </div>
      </footer>

      {/* MODAL: Case Studies Details */}
      {activeCaseStudy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-left text-white font-mono uppercase text-xs">
            <div className="flex justify-between items-center border-b pb-4 mb-6 border-zinc-800">
              <h3 className="text-base font-bold text-sky-400">Detalle del Caso de Estudio</h3>
              <button 
                onClick={() => setActiveCaseStudy(null)}
                className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            {(() => {
              const cs = caseStudies.find(c => c.id === activeCaseStudy);
              if (!cs) return null;
              return (
                <div className="space-y-6">
                  <div>
                    <span className="text-zinc-500 block mb-1">PROYECTO</span>
                    <p className="text-sm font-bold text-white">{cs.title}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500 block mb-1">CLIENTE</span>
                    <p className="text-white">{cs.client}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500 block mb-1">REQUERIMIENTO</span>
                    <p className="text-zinc-300 leading-relaxed">{cs.description}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500 block mb-1">SOLUCIÓN TÉCNICA</span>
                    <p className="text-zinc-300 leading-relaxed">{cs.details}</p>
                  </div>
                  <div className="p-4 rounded bg-zinc-950 border border-zinc-800">
                    <span className="text-zinc-500 block mb-1">MÉTRICAS LOGRADAS</span>
                    <p className="text-emerald-400 font-bold">{cs.metrics}</p>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* DRAWERS & ADDITIONAL MODALS */}
      {comparedProductIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950 border-t border-zinc-800 p-4 shadow-2xl backdrop-blur-md">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Sliders className="w-5 h-5 text-cyan-400" />
              <span className="font-mono text-xs uppercase tracking-wider text-zinc-300">
                Comparando {comparedProductIds.length} equipos seleccionados
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setComparedProductIds([])}
                className="text-zinc-500 hover:text-white uppercase font-mono text-[10px] tracking-wider px-3 py-1.5 transition-all"
              >
                Limpiar
              </button>
              <button 
                onClick={() => {
                  const selected = products.filter(p => comparedProductIds.includes(p.id));
                  setActiveProductDetails({
                    comparisonList: selected
                  });
                }}
                style={{ backgroundColor: primaryColor }}
                className="px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-white hover:opacity-90 active:scale-95 transition-all cursor-pointer"
              >
                Comparar Fichas Técnicas
              </button>
            </div>
          </div>
        </div>
      )}

      {activeProductDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-5xl bg-white border border-zinc-200 rounded-lg p-6 md:p-8 text-left text-zinc-800 font-sans normal-case text-sm my-8 max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b pb-4 mb-6 border-zinc-200">
              <div>
                <span className="text-zinc-500 block mb-1 text-[9px] tracking-widest font-mono uppercase">// FICHA TÉCNICA Y DIAGNÓSTICO</span>
                <h3 className="text-xl font-bold text-zinc-900 tracking-tight">
                  {activeProductDetails.comparisonList ? "Tabla Comparativa de Equipos" : activeProductDetails.name}
                </h3>
              </div>
              <button 
                onClick={() => setActiveProductDetails(null)}
                className="p-1.5 rounded bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-500 hover:text-zinc-900 transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            {activeProductDetails.comparisonList ? (
              /* COMPARISON DRAW SHEET */
              <div className="overflow-x-auto border border-zinc-200 rounded-lg">
                <table className="w-full text-left text-xs border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50">
                      <th className="p-3 text-zinc-500 font-mono text-[9px] uppercase tracking-wider">Parámetro</th>
                      {activeProductDetails.comparisonList.map((item: any) => (
                        <th key={item.id} className="p-3 font-bold text-zinc-900" style={{ color: primaryColor }}>
                          {item.sku}
                          <span className="block text-[9px] text-zinc-500 font-normal uppercase normal-case truncate mt-0.5">{item.name}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-zinc-150 hover:bg-zinc-50/50">
                      <td className="p-3 text-zinc-500 font-medium">Caudal Máximo</td>
                      {activeProductDetails.comparisonList.map((item: any) => (
                        <td key={item.id} className="p-3 font-bold text-zinc-900">{item.caudalVal}</td>
                      ))}
                    </tr>
                    <tr className="border-b border-zinc-150 hover:bg-zinc-50/50">
                      <td className="p-3 text-zinc-500 font-medium">Presión Máxima</td>
                      {activeProductDetails.comparisonList.map((item: any) => (
                        <td key={item.id} className="p-3 font-bold text-zinc-900">{item.presionVal}</td>
                      ))}
                    </tr>
                    <tr className="border-b border-zinc-150 hover:bg-zinc-50/50">
                      <td className="p-3 text-zinc-500 font-medium">Motor Requerido</td>
                      {activeProductDetails.comparisonList.map((item: any) => (
                        <td key={item.id} className="p-3 font-bold text-zinc-900">{item.motorVal}</td>
                      ))}
                    </tr>
                    <tr className="border-b border-zinc-150 hover:bg-zinc-50/50">
                      <td className="p-3 text-zinc-500 font-medium">Eficiencia Energética</td>
                      {activeProductDetails.comparisonList.map((item: any) => (
                        <td key={item.id} className="p-3 font-bold text-zinc-900">{item.eficienciaVal}</td>
                      ))}
                    </tr>
                    <tr className="border-b border-zinc-150 hover:bg-zinc-50/50">
                      <td className="p-3 text-zinc-500 font-medium">Emisión Ruido</td>
                      {activeProductDetails.comparisonList.map((item: any) => (
                        <td key={item.id} className="p-3 font-bold text-zinc-900">{item.ruidoVal}</td>
                      ))}
                    </tr>
                    <tr className="border-b border-zinc-150 hover:bg-zinc-50/50">
                      <td className="p-3 text-zinc-500 font-medium">Material Estructural</td>
                      {activeProductDetails.comparisonList.map((item: any) => (
                        <td key={item.id} className="p-3 text-zinc-700">{item.material}</td>
                      ))}
                    </tr>
                    <tr className="border-b border-zinc-150 hover:bg-zinc-50/50">
                      <td className="p-3 text-zinc-500 font-medium">Certificaciones</td>
                      {activeProductDetails.comparisonList.map((item: any) => (
                        <td key={item.id} className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {item.certificaciones.map((cert: string, idx: number) => (
                              <span key={idx} className="px-1.5 py-0.5 bg-zinc-100 text-zinc-600 text-[8px] rounded border border-zinc-200 font-mono">
                                {cert}
                              </span>
                            ))}
                          </div>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-zinc-200 bg-zinc-50/30">
                      <td className="p-3 text-zinc-500 font-medium">Estado / Plazo</td>
                      {activeProductDetails.comparisonList.map((item: any) => (
                        <td key={item.id} className="p-3">
                          <span className="text-[10px] font-bold" style={{ color: primaryColor }}>{item.status}</span>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 text-zinc-500 font-medium">Acción Comercial</td>
                      {activeProductDetails.comparisonList.map((item: any) => (
                        <td key={item.id} className="p-3">
                          <Link
                            href={`/wizard?tenant=${tenantCode}&product=${item.id}`}
                            className="inline-block px-3 py-1.5 font-mono text-[9px] font-bold text-zinc-950 uppercase tracking-wider text-center transition-all cursor-pointer rounded shadow-sm hover:opacity-90"
                            style={{ backgroundColor: primaryColor }}
                          >
                            Cotizar
                          </Link>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              /* SINGLE DETAILED TECHNICAL SPEC SHEET */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Visual rendering section + Operation curve chart */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Schematic Rendering Frame */}
                  <div className="h-60 bg-gradient-to-b from-zinc-50 to-zinc-100/50 border border-zinc-200 flex flex-col items-center justify-center relative p-4 rounded-md">
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                      <div className="w-full h-full" style={{
                        backgroundImage: "radial-gradient(circle, #777 1px, transparent 1px)",
                        backgroundSize: "16px 16px"
                      }} />
                    </div>
                    
                    {/* Spinning SVG */}
                    <svg className="w-32 h-32 text-zinc-300 animate-[spin_60s_linear_infinite]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.75">
                      <circle cx="50" cy="50" r="45" strokeDasharray="3 3" />
                      <circle cx="50" cy="50" r="30" />
                      <circle cx="50" cy="50" r="10" />
                      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg: number) => (
                        <path 
                          key={deg} 
                          d="M 50 50 Q 65 30 75 40" 
                          transform={`rotate(${deg} 50 50)`}
                          strokeWidth="1.25"
                          style={{ color: primaryColor, opacity: 0.8 }}
                        />
                      ))}
                      <circle cx="50" cy="50" r="2.5" fill="currentColor" />
                    </svg>

                    <div className="absolute bottom-2 left-2 text-[7px] text-zinc-400 uppercase tracking-widest font-mono">
                      // RENDIMIENTO DINÁMICO VECTORIAL
                    </div>
                  </div>

                  {/* Simulated Operations Curve Chart */}
                  <div className="border border-zinc-200 p-4 bg-zinc-50 space-y-3 rounded-md">
                    <div className="flex justify-between items-center border-b border-zinc-200 pb-2">
                      <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider font-mono">// Curva Operativa de Presión y Caudal</span>
                      <span className="text-[7px] text-emerald-600 font-mono tracking-widest uppercase font-bold">Punto Ajustado</span>
                    </div>

                    <div className="relative">
                      {/* Curve Chart */}
                      <svg viewBox="0 0 300 130" className="w-full h-32 text-zinc-400">
                        {/* Axes */}
                        <line x1="30" y1="10" x2="30" y2="110" stroke="#bbb" strokeWidth="1" />
                        <line x1="30" y1="110" x2="280" y2="110" stroke="#bbb" strokeWidth="1" />
                        {/* Grid lines */}
                        <line x1="30" y1="35" x2="280" y2="35" stroke="#eee" strokeWidth="0.5" strokeDasharray="2 2" />
                        <line x1="30" y1="65" x2="280" y2="65" stroke="#eee" strokeWidth="0.5" strokeDasharray="2 2" />
                        <line x1="150" y1="10" x2="150" y2="110" stroke="#eee" strokeWidth="0.5" strokeDasharray="2 2" />
                        {/* Operation Curve */}
                        <path d={specs?.curvePath || "M 30 30 Q 130 45 270 100"} fill="none" stroke={primaryColor} strokeWidth="2.5" />
                        {/* Operating point intersection */}
                        <circle cx={specs?.ptX || 150} cy={specs?.ptY || 50} r="4" fill="#10b981" className="animate-ping" />
                        <circle cx={specs?.ptX || 150} cy={specs?.ptY || 50} r="3" fill="#10b981" />
                        {/* Labels */}
                        <text x="5" y="65" fill="#71717a" fontSize="6" transform="rotate(-90 5 65)">Presión estática (Pa)</text>
                        <text x="135" y="122" fill="#71717a" fontSize="6">Caudal (m³/h)</text>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Technical parameters sheet */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Product Description */}
                  <div className="bg-zinc-50 p-4 border border-zinc-150 rounded-md">
                    <span className="text-[9px] font-mono font-bold tracking-widest block text-zinc-500 uppercase">// MEMORIA DESCRIPTIVA</span>
                    <p className="text-xs text-zinc-650 mt-1.5 leading-relaxed normal-case">
                      {activeProductDetails.description || `Unidad turbomecánica de alta confiabilidad y rendimiento aerodinámico constante, especialmente optimizada para soportar operación continua en condiciones de trabajo pesado en Colombia. Su balanceo calibrado por láser minimiza vibraciones mecánicas y prolonga la vida útil del motor.`}
                    </p>
                  </div>

                  {/* General Specifications Sheet */}
                  <div className="border border-zinc-200 p-4 bg-zinc-50/30 rounded-md">
                    <span className="text-[8px] text-zinc-500 font-bold block mb-3 tracking-widest uppercase font-mono">// ESPECIFICACIONES TÉCNICAS HOMOLOGADAS</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 font-mono text-[9px] uppercase">
                      <div className="flex justify-between border-b border-zinc-150 pb-1.5">
                        <span className="text-zinc-500">Modelo SKU</span>
                        <span className="text-zinc-950 font-bold">{activeProductDetails.sku}</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-150 pb-1.5">
                        <span className="text-zinc-500">Caudal Operativo</span>
                        <span className="text-zinc-950 font-bold">{activeProductDetails.caudalVal}</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-150 pb-1.5">
                        <span className="text-zinc-500">Presión Operativa</span>
                        <span className="text-zinc-950 font-bold">{activeProductDetails.presionVal}</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-150 pb-1.5">
                        <span className="text-zinc-500">Potencia de Motor</span>
                        <span className="text-zinc-950 font-bold">{activeProductDetails.motorVal}</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-150 pb-1.5">
                        <span className="text-zinc-500">Eficiencia Térmica</span>
                        <span className="text-zinc-950 font-bold">{activeProductDetails.eficienciaVal}</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-150 pb-1.5">
                        <span className="text-zinc-500">Emisión Sonora</span>
                        <span className="text-zinc-950 font-bold">{activeProductDetails.ruidoVal}</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-150 pb-1.5">
                        <span className="text-zinc-500">Material de Chasis</span>
                        <span className="text-zinc-950 font-bold">{activeProductDetails.material}</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-150 pb-1.5">
                        <span className="text-zinc-500">Familia / Línea</span>
                        <span className="text-zinc-950 font-bold">{activeProductDetails.familyName}</span>
                      </div>
                      {/* Advanced Industrial Specs */}
                      <div className="flex justify-between border-b border-zinc-150 pb-1.5">
                        <span className="text-zinc-500">Tipo de Acople</span>
                        <span className="text-zinc-950 font-bold">{specs?.acople || "Directo"}</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-150 pb-1.5">
                        <span className="text-zinc-500">Aislamiento Motor</span>
                        <span className="text-zinc-950 font-bold">{specs?.aislamiento || "IP55/F"}</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-150 pb-1.5">
                        <span className="text-zinc-500">Rodamientos</span>
                        <span className="text-zinc-950 font-bold">{specs?.rodamientos || "SKF/NSK"}</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-150 pb-1.5">
                        <span className="text-zinc-500">Balanceo Dinámico</span>
                        <span className="text-zinc-950 font-bold">{specs?.balanceo || "G 2.5"}</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-150 pb-1.5">
                        <span className="text-zinc-500">Límite Temp.</span>
                        <span className="text-zinc-950 font-bold">{specs?.tempMax || "80°C"}</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-150 pb-1.5">
                        <span className="text-zinc-500">Espesor de Lámina</span>
                        <span className="text-zinc-950 font-bold">{specs?.thickness || "2.5mm"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Certificaciones y aplicaciones */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border border-zinc-200 p-4 rounded-md">
                      <span className="text-[8px] text-zinc-500 font-bold block mb-3 tracking-widest uppercase font-mono">// CERTIFICACIONES & NORMAS</span>
                      <div className="flex flex-wrap gap-1.5">
                        {activeProductDetails.certificaciones.map((cert: string, idx: number) => (
                          <span key={idx} className="px-2 py-1 bg-zinc-50 text-zinc-700 rounded border border-zinc-200 text-[8px] font-bold font-mono">
                            ✓ {cert}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="border border-zinc-200 p-4 rounded-md">
                      <span className="text-[8px] text-zinc-500 font-bold block mb-3 tracking-widest uppercase font-mono">// ENTORNOS DE APLICACIÓN</span>
                      <div className="flex flex-wrap gap-1.5">
                        {activeProductDetails.aplicaciones.map((app: string, idx: number) => (
                          <span key={idx} className="px-2 py-1 bg-zinc-50 text-zinc-700 rounded border border-zinc-200 text-[8px] font-bold font-mono">
                            • {app}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Documentación y Descargas de Ingeniería */}
                  <div className="border border-zinc-200 p-4 rounded-md bg-zinc-50">
                    <span className="text-[8px] text-zinc-500 block mb-3 tracking-widest uppercase font-mono">// DOCUMENTACIÓN DE INGENIERÍA</span>
                    <div className="space-y-2">
                      <button 
                        onClick={() => {
                          setActiveProductDetails(null);
                          setActiveDocDownload(activeProductDetails.name);
                        }}
                        className="w-full p-3 bg-white hover:bg-zinc-50 border border-zinc-200 text-left flex items-center justify-between text-xs transition-all font-mono uppercase cursor-pointer rounded shadow-sm"
                      >
                        <span className="text-zinc-700 font-bold">Ficha Técnica Completa (PDF)</span>
                        <span className="font-bold" style={{ color: primaryColor }}>PDF [2.4 MB]</span>
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
