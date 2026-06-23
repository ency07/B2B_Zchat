"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Cpu, 
  Wind, 
  DollarSign, 
  User, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  AlertCircle,
  FileCheck,
  Briefcase,
  AlertTriangle,
  Flame,
  Gauge,
  Sparkles,
  Download,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitWizardData, WizardResult } from "@/app/actions/wizard";
import { calculateRequiredCfm } from "@/utils/engineering";
import { estimatePrice } from "@/utils/pricing";

interface WizardStepperProps {
  branding: Record<string, any>;
}

// Lista oficial de ciudades industriales de Colombia
const COLOMBIAN_CITIES = [
  { name: "Bogotá, D.C.", search: "bogota dc cundinamarca" },
  { name: "Medellín, Antioquia", search: "medellin antioquia valle de aburra" },
  { name: "Cali, Valle del Cauca", search: "cali valle del cauca" },
  { name: "Barranquilla, Atlántico", search: "barranquilla atlantico" },
  { name: "Cartagena, Bolívar", search: "cartagena bolivar" },
  { name: "Bucaramanga, Santander", search: "bucaramanga santander" },
  { name: "Manizales, Caldas", search: "manizales caldas" },
  { name: "Pereira, Risaralda", search: "pereira risaralda" },
  { name: "Yumbo, Valle del Cauca", search: "yumbo valle del cauca" },
  { name: "Itagüí, Antioquia", search: "itagui antioquia" },
  { name: "Soledad, Atlántico", search: "soledad atlantico" },
];

export default function WizardStepper({ branding }: WizardStepperProps) {
  const searchParams = useSearchParams();
  const preselectedProduct = searchParams.get("product") || "";

  // Colores dinámicos del Tenant
  const primaryColor = branding.color_primario || "#0284c7";
  const siteName = branding.nombre_comercial || "VentiTech";
  const siteLogo = branding.logo_claro_url || "";

  // Estado del Wizard
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<WizardResult | null>(null);

  // Formulario
  const [form, setForm] = useState({
    servicio: "venta" as "fabricacion" | "venta" | "mantenimiento" | "reparacion",
    urgencia: "media" as "baja" | "media" | "alta",
    length: 10,
    width: 8,
    height: 4,
    environment: "default" as "heavy_plant" | "data_center" | "mining" | "warehouse" | "default",
    nombre: "",
    empresa: "",
    cargo: "Ingeniero de Proyectos",
    telefono: "",
    email: "",
    ciudad: "",
  });

  // Checklist de Síntomas / Desgaste
  const [symptoms, setSymptoms] = useState({
    heat: false,       // Alta carga térmica
    dust: false,       // Polución
    humidity: false,   // Vapor corrosivo
    gases: false,      // Gases u olores
  });

  // Autocomplete de ciudades
  const [cityInputFocus, setCityInputFocus] = useState(false);
  const [filteredCities, setFilteredCities] = useState(COLOMBIAN_CITIES);

  // Cálculos en tiempo real
  const [realtimeCfm, setRealtimeCfm] = useState({ cfm: 0, cubicMeters: 0 });
  const [realtimePrice, setRealtimePrice] = useState({ rangeMinCop: 0, rangeMaxCop: 0, rangeMinUsd: 0, rangeMaxUsd: 0 });

  // Ticker de Caudal animado a 60fps
  const [animatedCfm, setAnimatedCfm] = useState(0);

  // Calcular severidad
  const calculateSeverityScore = () => {
    let score = 0;
    if (symptoms.heat) score += 25;
    if (symptoms.dust) score += 25;
    if (symptoms.humidity) score += 20;
    if (symptoms.gases) score += 30;
    return score;
  };

  const severityScore = calculateSeverityScore();
  const severityLevel = severityScore >= 70 ? "CRÍTICA" : severityScore >= 30 ? "MODERADA" : "BAJA";

  // Pre-poblar formulario con parámetros de la landing si existen
  useEffect(() => {
    const qLength = searchParams.get("length");
    const qWidth = searchParams.get("width");
    const qHeight = searchParams.get("height");
    const qEnv = searchParams.get("environment");
    
    if (qLength || qWidth || qHeight || qEnv) {
      setForm(prev => ({
        ...prev,
        length: qLength ? Number(qLength) : prev.length,
        width: qWidth ? Number(qWidth) : prev.width,
        height: qHeight ? Number(qHeight) : prev.height,
        environment: (qEnv as any) || prev.environment,
      }));
    }
  }, [searchParams]);

  useEffect(() => {
    // Calcular en tiempo real cuando cambien las dimensiones o el ambiente
    const eng = calculateRequiredCfm(
      { length: Number(form.length), width: Number(form.width), height: Number(form.height) },
      form.environment
    );
    setRealtimeCfm({ cfm: eng.cfm, cubicMeters: eng.cubicMeters });

    // Estimar precio
    const prc = estimatePrice(form.servicio, form.urgencia, eng.cubicMeters);
    setRealtimePrice({
      rangeMinCop: prc.rangeMinCop,
      rangeMaxCop: prc.rangeMaxCop,
      rangeMinUsd: prc.rangeMinUsd,
      rangeMaxUsd: prc.rangeMaxUsd
    });
  }, [form.length, form.width, form.height, form.environment, form.servicio, form.urgencia]);

  // Interpolación de contador digital (60fps)
  useEffect(() => {
    const target = realtimeCfm.cfm;
    let start = animatedCfm;
    if (start === target) return;

    const duration = 250; // ms
    const startTime = performance.now();
    let animationFrameId: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress * (2 - progress); // Ease out quadratic
      const current = Math.round(start + (target - start) * ease);

      setAnimatedCfm(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(tick);
      }
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [realtimeCfm.cfm]);

  // Filtrar ciudades
  useEffect(() => {
    const normalized = form.ciudad.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (!normalized) {
      setFilteredCities(COLOMBIAN_CITIES);
    } else {
      const filtered = COLOMBIAN_CITIES.filter(c => 
        c.search.includes(normalized) || c.name.toLowerCase().includes(normalized)
      );
      setFilteredCities(filtered);
    }
  }, [form.ciudad]);

  // Manejar cambios de inputs
  const handleChange = (key: string, val: any) => {
    setForm(prev => ({ ...prev, [key]: val }));
    if (errors[key]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  const handleSymptomToggle = (key: "heat" | "dust" | "humidity" | "gases") => {
    setSymptoms(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Validaciones por paso
  const validateStep = (currentStep: number): boolean => {
    const stepErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!form.servicio) stepErrors.servicio = "Seleccione un servicio.";
      if (!form.urgencia) stepErrors.urgencia = "Seleccione el nivel de urgencia.";
    }

    if (currentStep === 2) {
      if (Number(form.length) <= 0 || isNaN(form.length)) stepErrors.length = "Largo debe ser mayor a 0.";
      if (Number(form.width) <= 0 || isNaN(form.width)) stepErrors.width = "Ancho debe ser mayor a 0.";
      if (Number(form.height) <= 0 || isNaN(form.height)) stepErrors.height = "Alto debe ser mayor a 0.";
      if (!form.environment) stepErrors.environment = "Seleccione un ambiente operativo.";
      
      const cityValid = COLOMBIAN_CITIES.some(c => c.name.toLowerCase() === form.ciudad.trim().toLowerCase()) || form.ciudad.trim().length > 2;
      if (!form.ciudad.trim()) {
        stepErrors.ciudad = "Ingrese la ciudad de la planta.";
      } else if (!cityValid) {
        stepErrors.ciudad = "Seleccione una ciudad de la lista para normalización.";
      }
    }

    if (currentStep === 3) {
      if (!form.nombre.trim()) stepErrors.nombre = "El nombre es obligatorio.";
      if (!form.empresa.trim()) stepErrors.empresa = "La razón social de la empresa es obligatoria.";
      if (!form.cargo) stepErrors.cargo = "Seleccione su cargo.";
      
      // Email corporativo
      const email = form.email.trim();
      if (!email) {
        stepErrors.email = "El correo electrónico es obligatorio.";
      } else if (!/\S+@\S+\.\S+/.test(email)) {
        stepErrors.email = "Ingrese un correo electrónico válido.";
      }
      
      // Teléfono colombiano
      const tel = form.telefono.trim();
      if (!tel) {
        stepErrors.telefono = "El teléfono corporativo es obligatorio.";
      } else if (!/^(\+?57)?(3\d{9}|60[1-8]\d{7})$/.test(tel)) {
        stepErrors.telefono = "Ingrese un teléfono colombiano válido (celular o fijo de 10 dígitos).";
      }
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  // Enviar sumisión final
  const handleSubmit = async () => {
    if (!validateStep(3)) {
      setStep(3);
      return;
    }

    setIsSubmitting(true);
    try {
      const finalResult = await submitWizardData("acme", {
        servicio: form.servicio,
        length: Number(form.length),
        width: Number(form.width),
        height: Number(form.height),
        environment: form.environment,
        nombre: form.nombre,
        empresa: form.empresa,
        cargo: form.cargo,
        telefono: form.telefono,
        email: form.email,
        ciudad: form.ciudad,
        urgencia: form.urgencia
      });
      setResult(finalResult);
      setStep(5); // Pantalla de éxito
    } catch (err: any) {
      console.error(err);
      setErrors({ global: err.message || "Error registrando la cotización." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // CLIENT-SIDE PDF GENERATION CON jspdf
  const generatePdfReport = async () => {
    if (!result) return;
    
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const primary = primaryColor;
      
      // PAGE 1: Portada
      doc.setFillColor(30, 30, 30);
      doc.rect(0, 0, 210, 297, "F");
      
      // Decoraciones Vectoriales
      doc.setDrawColor(2, 132, 199);
      doc.setLineWidth(1.5);
      doc.line(15, 15, 195, 15);
      doc.line(15, 282, 195, 282);

      doc.setTextColor(255, 255, 255);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(22);
      doc.text("INFORME DE PREINGENIERÍA INDUSTRIAL", 105, 70, { align: "center" });
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(156, 163, 175);
      doc.text("Estudio de Renovación de Aire y Caudal Requerido (CFM)", 105, 80, { align: "center" });

      doc.setDrawColor(82, 82, 91);
      doc.setLineWidth(0.5);
      doc.line(40, 95, 170, 95);

      // Metadatos
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.text(`Código de Reporte: ${result.diagnosticCode}`, 45, 120);
      doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString("es-CO")}`, 45, 130);
      doc.text(`Proveedor Técnico: ${siteName}`, 45, 140);
      
      // Datos Cliente
      doc.setFillColor(39, 39, 42);
      doc.rect(40, 160, 130, 60, "F");
      
      doc.setFont("Helvetica", "bold");
      doc.text("INFORMACIÓN DEL LEADO / PLANTA", 45, 172);
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(212, 212, 216);
      doc.text(`Contacto: ${form.nombre}`, 45, 182);
      doc.text(`Empresa: ${form.empresa}`, 45, 192);
      doc.text(`Cargo: ${form.cargo}`, 45, 202);
      doc.text(`Ubicación: ${form.ciudad}, Colombia`, 45, 212);

      doc.setFontSize(9);
      doc.setTextColor(113, 113, 122);
      doc.text("VentiTech B2B Premium HVAC Systems", 105, 270, { align: "center" });

      // PAGE 2: Parámetros Técnicos
      doc.addPage();
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, 210, 297, "F");

      // Encabezado
      doc.setFillColor(30, 30, 30);
      doc.rect(0, 0, 210, 30, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(14);
      doc.text("VENTITECH - REPORTE DE CÁLCULO DE CAUDAL", 15, 18);

      doc.setTextColor(30, 30, 30);
      doc.setFontSize(12);
      doc.text("1. PARÁMETROS GEOMÉTRICOS Y DIMENSIONALES", 15, 48);

      // Tabla de Datos Físicos
      doc.setDrawColor(228, 228, 231);
      doc.setLineWidth(0.3);
      doc.line(15, 55, 195, 55);

      doc.setFontSize(10);
      doc.setFont("Helvetica", "bold");
      doc.text("Parámetro", 20, 62);
      doc.text("Valor Planta", 90, 62);
      doc.text("Detalle de Ingeniería", 140, 62);
      doc.line(15, 66, 195, 66);

      doc.setFont("Helvetica", "normal");
      doc.text("Dimensiones del Galpón", 20, 74);
      doc.text(`${form.length}m x ${form.width}m x ${form.height}m`, 90, 74);
      doc.text("Largo x Ancho x Alto", 140, 74);
      doc.line(15, 78, 195, 78);

      doc.text("Volumen Físico Total", 20, 86);
      doc.text(`${Math.round(result.calculatedVolumeM3)} m3`, 90, 86);
      doc.text(`(${Math.round(result.calculatedVolumeM3 * 35.3147)} pies cúbicos)`, 140, 86);
      doc.line(15, 90, 195, 90);

      doc.text("Entorno de Trabajo", 20, 98);
      doc.text(`${form.environment === "heavy_plant" ? "Planta Pesada" : form.environment === "data_center" ? "Data Center" : form.environment === "mining" ? "Minería" : form.environment === "warehouse" ? "Bodega" : "Área Común"}`, 90, 98);
      doc.text(`${form.environment === "heavy_plant" ? "35 ACH" : form.environment === "data_center" ? "25 ACH" : form.environment === "mining" ? "55 ACH" : form.environment === "warehouse" ? "12 ACH" : "10 ACH"} Renovaciones/Hora`, 140, 98);
      doc.line(15, 102, 195, 102);

      doc.setFont("Helvetica", "bold");
      doc.text("CAUDAL REQUERIDO", 20, 110);
      doc.setTextColor(2, 132, 199);
      doc.text(`${result.requiredCfm.toLocaleString()} CFM`, 90, 110);
      doc.setTextColor(30, 30, 30);
      doc.text(`Clasificación: ${result.cfmCategory}`, 140, 110);
      doc.line(15, 114, 195, 114);

      // Severidad
      doc.text("2. DIAGNÓSTICO DE AMBIENTE OPERATIVO", 15, 135);
      doc.line(15, 140, 195, 140);
      doc.setFont("Helvetica", "normal");
      doc.text(`Índice de Severidad de Desgaste en Planta: ${severityScore}% - NIVEL ${severityLevel}`, 20, 148);
      
      doc.setFont("Helvetica", "bold");
      doc.text("Sugerencias de Diseño Aerodinámico:", 20, 160);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      
      let recoText = "Se recomienda el uso de álabes tipo axial estándar y persianas de gravedad de aluminio.";
      if (severityScore >= 70) {
        recoText = "CRÍTICO: Obligatorio el uso de extractores tipo Blower o Hongo con recubrimiento epóxico anticorrosivo, álabes de aluminio extruido y motores cerrados contra polvo/humedad.";
      } else if (severityScore >= 30) {
        recoText = "MODERADO: Se sugiere protección contra humedad y filtros de partículas de carbón activado si hay gases/olores en suspensión.";
      }
      
      doc.text(doc.splitTextToSize(recoText, 170), 20, 168);

      // PAGE 3: Estimación y Garantía
      doc.addPage();
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, 210, 297, "F");

      // Encabezado Page 3
      doc.setFillColor(30, 30, 30);
      doc.rect(0, 0, 210, 30, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(14);
      doc.text("VENTITECH - PROPUESTA COMERCIAL PRELIMINAR", 15, 18);

      doc.setTextColor(30, 30, 30);
      doc.setFontSize(12);
      doc.text("3. ESTIMACIÓN PRESUPUESTARIA PRELIMINAR (B2B)", 15, 48);
      doc.line(15, 52, 195, 52);

      // Tabla Precios
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Moneda de Referencia", 20, 62);
      doc.text("Rango de Inversión Mínimo", 80, 62);
      doc.text("Rango de Inversión Máximo", 140, 62);
      doc.line(15, 66, 195, 66);

      doc.setFont("Helvetica", "normal");
      doc.text("Pesos Colombianos (COP)", 20, 74);
      doc.text(formatCurrency(result.estimatedPriceMinCop), 80, 74);
      doc.text(formatCurrency(result.estimatedPriceMaxCop), 140, 74);
      doc.line(15, 78, 195, 78);

      doc.text("Dólares Americanos (USD)", 20, 86);
      doc.text(formatUsd(result.estimatedPriceMinUsd), 80, 86);
      doc.text(formatUsd(result.estimatedPriceMaxUsd), 140, 86);
      doc.line(15, 90, 195, 90);

      // Nota de Desviación
      doc.setFontSize(8.5);
      doc.setTextColor(113, 113, 122);
      doc.text("Nota: La estimación presupuestal incluye una desviación de ±15% y está calculada en base a las dimensiones ingresadas y la urgencia comercial especificada. Tasa fija de conversión: 1 USD = 4,000 COP.", 15, 100, { maxWidth: 180 });

      // Garantía
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(12);
      doc.setFont("Helvetica", "bold");
      doc.text("4. COBERTURA Y POLÍTICA DE GARANTÍA", 15, 120);
      doc.line(15, 124, 195, 124);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Todos los proyectos de ventilación mecánica VentiTech son cubiertos bajo una Garantía de Fábrica Estándar de 12 meses computados a partir del cierre operacional de la Orden de Trabajo en el ERP. La garantía cubre fallas mecánicas de motor, deformación de álabes y problemas de balanceo estático-dinámico bajo uso normal en planta.", 20, 132, { maxWidth: 170 });

      // Firma y Disclaimer
      doc.setFillColor(244, 244, 245);
      doc.rect(15, 165, 180, 45, "F");
      
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.text("DISCLAIMER / AVISO LEGAL DE INGENIERÍA", 20, 175);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(113, 113, 122);
      doc.text("Este estudio de preingeniería es de carácter informativo y preliminar. No reemplaza un diseño ejecutivo detallado firmado por un ingeniero mecánico certificado. VentiTech no se hace responsable por variaciones térmicas o de presión si las dimensiones o renovación de aire real del establecimiento difieren de las ingresadas en este wizard.", 20, 183, { maxWidth: 170 });

      // Guardar PDF
      doc.save(`VentiTech_Reporte_Preingenieria_${result.diagnosticCode}.pdf`);
    } catch (err) {
      console.error("Error generating pdf client-side:", err);
    }
  };

  // WhatsApp click
  const getWhatsAppLink = () => {
    if (!result) return "";
    const text = `Hola VentiTech. He terminado mi diagnóstico técnico en el wizard con código de reporte *${result.diagnosticCode}*.
    
- *Caudal Requerido:* ${result.requiredCfm.toLocaleString()} CFM (${result.cfmCategory})
- *Empresa:* ${form.empresa} (Ciudad: ${form.ciudad})
- *Contacto:* ${form.nombre} (${form.cargo})
- *Servicio:* ${form.servicio === "venta" ? "Venta" : "Fabricación"}

Solicito una cotización formal y confirmación de disponibilidad técnica. Gracias.`;
    return `https://wa.me/573123456789?text=${encodeURIComponent(text)}`;
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(val);
  };

  const formatUsd = (val: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xl text-zinc-800">
      {/* Dynamic Theme Color Injection */}
      <style>{`
        .hex-clip {
          clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
        }
      `}</style>

      {/* Header del Stepper */}
      <div className="bg-zinc-50 p-6 border-b border-zinc-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {siteLogo ? (
            <img src={siteLogo} alt={siteName} className="h-8 w-auto object-contain" />
          ) : (
            <div className="p-2 rounded-lg border" style={{ backgroundColor: `${primaryColor}10`, color: primaryColor, borderColor: `${primaryColor}20` }}>
              <Wind className="w-4.5 h-4.5 animate-spin-slow" />
            </div>
          )}
          <div>
            <span className="text-[9px] uppercase font-bold tracking-widest font-mono" style={{ color: primaryColor }}>
              Cotizador Inteligente B2B
            </span>
            <h1 className="text-sm font-black text-zinc-900 flex items-center gap-1.5 font-display uppercase tracking-wider">
              Preingeniería HVAC {siteName}
            </h1>
          </div>
        </div>
        <Link href="/" className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 hover:text-zinc-900 transition-colors">
          Volver al catálogo
        </Link>
      </div>

      {/* SCADA HEXAGON STEPPER CON LÍNEAS DE FLUJO */}
      {step <= 4 && (
        <div className="bg-zinc-50/50 border-b border-zinc-200 p-5 flex items-center justify-between relative px-8 md:px-16 overflow-x-auto gap-4">
          {[
            { label: "Servicio", desc: "Tipo & Prioridad", stepNo: 1 },
            { label: "Análisis", desc: "Dim. & ACH", stepNo: 2 },
            { label: "Contacto", desc: "Datos B2B", stepNo: 3 },
            { label: "Cálculos", desc: "CFM & Inversión", stepNo: 4 }
          ].map((s, idx) => {
            const isActive = step === s.stepNo;
            const isCompleted = step > s.stepNo;
            
            return (
              <div key={idx} className="flex items-center gap-3 z-15 shrink-0">
                {/* Hex Pip */}
                <div 
                  className="w-10 h-11 relative flex items-center justify-center transition-all duration-300"
                  style={{
                    color: isActive ? primaryColor : isCompleted ? "#10b981" : "#a1a1aa"
                  }}
                >
                  <div className={`absolute inset-0 hex-clip transition-all duration-300 ${
                    isActive 
                      ? "border" 
                      : isCompleted 
                        ? "bg-emerald-50 border border-emerald-200" 
                        : "bg-white border border-zinc-200"
                  }`}
                  style={isActive ? { backgroundColor: `${primaryColor}0c`, borderColor: `${primaryColor}44` } : undefined}
                  />
                  <span className="font-mono text-xs font-bold relative z-10">
                    {isCompleted ? <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" /> : `0${s.stepNo}`}
                  </span>
                </div>
                
                {/* Labels */}
                <div className="text-left hidden sm:block">
                  <div 
                    className="text-[10px] font-bold uppercase tracking-widest leading-none"
                    style={{
                      color: isActive ? primaryColor : isCompleted ? "#10b981" : "#71717a"
                    }}
                  >
                    {s.label}
                  </div>
                  <div className="text-[9px] text-zinc-400 mt-0.5 leading-none font-medium font-mono">
                    {s.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cuerpo del Stepper */}
      <div className="grid lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-zinc-200 border-t border-zinc-200">
        
        {/* Lado Formulario */}
        <div className={`${step <= 4 ? "lg:col-span-7" : "lg:col-span-12"} p-8 min-h-[380px]`}>
          {errors.global && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errors.global}</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* PASO 1 */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-base font-bold text-zinc-900 font-display uppercase tracking-wider">¿Qué servicio o equipo necesita?</h2>
                  <p className="text-xs text-zinc-500 mt-1">Especifique el tipo de requerimiento y la urgencia comercial de su planta.</p>
                </div>

                {preselectedProduct && (
                  <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl flex items-center gap-3">
                    <Wind className="w-5 h-5 text-sky-600" />
                    <div className="text-xs text-zinc-700">
                      <span className="font-semibold text-zinc-500">Modelo Seleccionado del Catálogo:</span>{" "}
                      <span className="text-sky-700 font-mono font-bold uppercase tracking-wider">{preselectedProduct}</span>
                    </div>
                  </div>
                )}

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="servicio" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      Clase de Requerimiento
                    </Label>
                    <select
                      id="servicio"
                      value={form.servicio}
                      onChange={(e) => handleChange("servicio", e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded-lg p-3 text-xs text-zinc-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-medium"
                    >
                      <option value="venta">Adquisición directa de Turbomaquinaria</option>
                      <option value="fabricacion">Diseño y Fabricación Industrial a Medida</option>
                      <option value="mantenimiento">Mantenimiento Correctivo de Ductos y Motores</option>
                      <option value="reparacion">Reparación Técnica / Ajustes de Álabes</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="urgencia" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      Prioridad Comercial (SLA)
                    </Label>
                    <select
                      id="urgencia"
                      value={form.urgencia}
                      onChange={(e) => handleChange("urgencia", e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded-lg p-3 text-xs text-zinc-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-medium"
                    >
                      <option value="baja">Baja (Proyecto en planeación - SLA estándar)</option>
                      <option value="media">Media (Proyecto prioritario, incremento +10%)</option>
                      <option value="alta">Alta (Emergencia en planta - SLA prioritario, incremento +35%)</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {/* PASO 2: ANÁLISIS TÉCNICO + TICKER LIVE + DIAGNÓSTICO SÍNTOMAS */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-zinc-200 pb-4 gap-4">
                  <div>
                    <h2 className="text-base font-bold text-zinc-900 font-display uppercase tracking-wider">Dimensiones & Análisis de Caudal</h2>
                    <p className="text-xs text-zinc-500 mt-1">Especifique las dimensiones físicas para calcular los CFM y m³ de renovación.</p>
                  </div>
                  
                  {/* Live CFM Ticker en el paso */}
                  <div className="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider block">Caudal en Tiempo Real</span>
                      <span className="font-mono text-sm font-bold text-sky-600">{animatedCfm.toLocaleString()} CFM</span>
                    </div>
                    <div className="p-2 rounded bg-sky-50 text-sky-600 border border-sky-200">
                      <Wind className="w-4 h-4 animate-spin-slow" />
                    </div>
                  </div>
                </div>

                {/* Grid Inputs */}
                <div className="grid gap-6 sm:grid-cols-3">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="length" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Largo (m)</Label>
                      <span className="text-[10px] font-mono text-zinc-400">Mín: 5m - Máx: 200m</span>
                    </div>
                    <Input
                      id="length"
                      type="number"
                      min="5"
                      max="200"
                      value={form.length}
                      onChange={(e) => handleChange("length", Number(e.target.value))}
                      className="bg-white border-zinc-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-xs text-zinc-800 font-mono"
                    />
                    {errors.length && <p className="text-[9px] text-red-500">{errors.length}</p>}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="width" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Ancho (m)</Label>
                      <span className="text-[10px] font-mono text-zinc-400">Mín: 5m - Máx: 100m</span>
                    </div>
                    <Input
                      id="width"
                      type="number"
                      min="5"
                      max="100"
                      value={form.width}
                      onChange={(e) => handleChange("width", Number(e.target.value))}
                      className="bg-white border-zinc-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-xs text-zinc-800 font-mono"
                    />
                    {errors.width && <p className="text-[9px] text-red-500">{errors.width}</p>}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="height" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Alto (m)</Label>
                      <span className="text-[10px] font-mono text-zinc-400">Mín: 3m - Máx: 30m</span>
                    </div>
                    <Input
                      id="height"
                      type="number"
                      min="3"
                      max="30"
                      value={form.height}
                      onChange={(e) => handleChange("height", Number(e.target.value))}
                      className="bg-white border-zinc-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-xs text-zinc-800 font-mono"
                    />
                    {errors.height && <p className="text-[9px] text-red-500">{errors.height}</p>}
                  </div>
                </div>

                {/* Grid Entorno & Ciudad */}
                <div className="grid gap-6 sm:grid-cols-2 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="environment" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      Entorno de Trabajo (Normas Ambientales)
                    </Label>
                    <select
                      id="environment"
                      value={form.environment}
                      onChange={(e) => handleChange("environment", e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded-lg p-3 text-xs text-zinc-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-medium"
                    >
                      <option value="default">Área Común (Comercial / Oficinas - 10 ACH)</option>
                      <option value="warehouse">Bodega de Almacenamiento Estándar (12 ACH)</option>
                      <option value="data_center">Data Center / Servidores (25 ACH)</option>
                      <option value="heavy_plant">Planta Pesada (Siderurgia/Química - 35 ACH)</option>
                      <option value="mining">Minería Subterránea / Túneles (55 ACH)</option>
                    </select>
                  </div>

                  <div className="space-y-2 relative">
                    <Label htmlFor="ciudad" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      Ciudad del Proyecto
                    </Label>
                    <Input
                      id="ciudad"
                      placeholder="Escriba para buscar ciudad colombiana..."
                      value={form.ciudad}
                      onChange={(e) => handleChange("ciudad", e.target.value)}
                      onFocus={() => setCityInputFocus(true)}
                      onBlur={() => setTimeout(() => setCityInputFocus(false), 200)}
                      className="bg-white border-zinc-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-xs text-zinc-800"
                    />
                    {errors.ciudad && <p className="text-[9px] text-red-500">{errors.ciudad}</p>}

                    {/* Dropdown autocompletado */}
                    {cityInputFocus && filteredCities.length > 0 && (
                      <div className="absolute z-20 top-[100%] left-0 w-full mt-1.5 max-h-48 overflow-y-auto bg-white border border-zinc-200 rounded-lg shadow-xl divide-y divide-zinc-100">
                        {filteredCities.map((city, idx) => (
                          <div
                            key={idx}
                            onMouseDown={() => handleChange("ciudad", city.name)}
                            className="p-3 text-xs text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 cursor-pointer font-medium"
                          >
                            {city.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Síntomas y Desgaste (Evaluación de Severidad) */}
                <div className="pt-4 border-t border-zinc-200">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-3">
                    Diagnóstico de Síntomas en Planta
                  </Label>
                  
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { key: "heat", label: "Alta Carga Térmica", desc: "Sensación de sofoco o temperaturas > 35°C." },
                      { key: "dust", label: "Material Particulado", desc: "Polvillo en suspensión, humo denso o virutas." },
                      { key: "humidity", label: "Humedad Relativa Alta", desc: "Vapor acumulado, condensación en techos." },
                      { key: "gases", label: "Emisión de Gases/Olores", desc: "Monóxido, solventes, soldadura o químicos." }
                    ].map((sym) => {
                      const isChecked = (symptoms as any)[sym.key];
                      return (
                        <div
                          key={sym.key}
                          onClick={() => handleSymptomToggle(sym.key as any)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3 ${
                            isChecked
                              ? "bg-sky-50 border-sky-200 text-zinc-900"
                              : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
                          }`}
                        >
                          <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center ${
                            isChecked ? "bg-sky-600 border-sky-600 text-white" : "border-zinc-300 bg-white"
                          }`}>
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <div>
                            <div className="text-xs font-bold font-display">{sym.label}</div>
                            <div className="text-[9px] text-zinc-500 mt-0.5 leading-relaxed font-light">{sym.desc}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* PASO 3 */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-base font-bold text-zinc-900 font-display uppercase tracking-wider">Información Corporativa B2B</h2>
                  <p className="text-xs text-zinc-500 mt-1">Ingrese sus datos corporativos para la emisión de la memoria de preingeniería.</p>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nombre" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Su Nombre Completo</Label>
                    <Input
                      id="nombre"
                      placeholder="Ej. Ing. Julio Gómez"
                      value={form.nombre}
                      onChange={(e) => handleChange("nombre", e.target.value)}
                      className="bg-white border-zinc-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-xs text-zinc-800"
                    />
                    {errors.nombre && <p className="text-[9px] text-red-500">{errors.nombre}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="empresa" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Razón Social Empresa</Label>
                    <Input
                      id="empresa"
                      placeholder="Ej. Acerías del Caribe S.A."
                      value={form.empresa}
                      onChange={(e) => handleChange("empresa", e.target.value)}
                      className="bg-white border-zinc-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-xs text-zinc-800"
                    />
                    {errors.empresa && <p className="text-[9px] text-red-500">{errors.empresa}</p>}
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Email Corporativo</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Ej. j.gomez@siderurgica.com"
                      value={form.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      className="bg-white border-zinc-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-xs text-zinc-800"
                    />
                    {errors.email && <p className="text-[9px] text-red-500">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefono" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Teléfono Corporativo</Label>
                    <Input
                      id="telefono"
                      placeholder="Ej. 3123456789 o 6013456789"
                      value={form.telefono}
                      onChange={(e) => handleChange("telefono", e.target.value)}
                      className="bg-white border-zinc-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-xs text-zinc-800 font-mono"
                    />
                    {errors.telefono && <p className="text-[9px] text-red-500">{errors.telefono}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cargo" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Cargo Profesional
                  </Label>
                  <select
                    id="cargo"
                    value={form.cargo}
                    onChange={(e) => handleChange("cargo", e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-lg p-3 text-xs text-zinc-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-medium"
                  >
                    <option value="Director de Planta">Director de Planta (Scoring Alto)</option>
                    <option value="Gerente de Mantenimiento">Gerente de Mantenimiento / Proyectos (Scoring Alto)</option>
                    <option value="Supervisor de HVAC">Supervisor HVAC / Operaciones (Scoring Alto)</option>
                    <option value="Ingeniero de Campo">Ingeniero de Campo / Planta (Scoring Medio)</option>
                    <option value="Compras / Abastecimiento">Compras / Abastecimiento (Scoring Medio)</option>
                    <option value="Otro">Otro Cargo (Scoring Estándar)</option>
                  </select>
                </div>

                {/* Detección de email público alert */}
                {(form.email.includes("@gmail.com") || form.email.includes("@hotmail.com") || form.email.includes("@outlook.com") || form.email.includes("@yahoo.com")) && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Detección de dominio de email público. Se aplicará un score penalizado para la asignación en el pipeline comercial.</span>
                  </div>
                )}
              </motion.div>
            )}

            {/* PASO 4 */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-base font-bold text-zinc-900 font-display uppercase tracking-wider font-semibold">Resumen de Preingeniería</h2>
                  <p className="text-xs text-zinc-500 mt-1">Verifique los cálculos volumétricos y rangos de inversión antes de confirmar la solicitud.</p>
                </div>

                {/* Métricas */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50">
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest font-mono">Volumen Planta</span>
                    <div className="text-base font-bold text-zinc-900 mt-1">
                      {Math.round(realtimeCfm.cubicMeters)} m³
                    </div>
                    <div className="text-[9px] text-zinc-500 font-mono mt-0.5">
                      ({Math.round(realtimeCfm.cubicMeters * 35.3147).toLocaleString()} pies³)
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50">
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest font-mono">Renovación</span>
                    <div className="text-base font-bold text-sky-600 mt-1 flex items-center gap-1.5">
                      <Wind className="w-4.5 h-4.5" /> {form.environment === "heavy_plant" ? 35 : form.environment === "data_center" ? 25 : form.environment === "mining" ? 55 : form.environment === "warehouse" ? 12 : 10} ACH
                    </div>
                    <span className="text-[9px] text-zinc-500">
                      Cambios de aire/hora
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50">
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest font-mono">Caudal Requerido</span>
                    <div className="text-base font-bold text-emerald-600 mt-1 font-mono">
                      {realtimeCfm.cfm.toLocaleString()} CFM
                    </div>
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">
                      Pies cúbicos / min
                    </span>
                  </div>
                </div>

                {/* Recomendación de Equipos */}
                <div className="p-4 rounded-xl border border-sky-100 bg-sky-50/50">
                  <h4 className="text-xs font-bold text-sky-700 uppercase tracking-widest mb-1 flex items-center gap-1.5 font-mono">
                    <Cpu className="w-4 h-4" /> Recomendación Técnica del Sistema
                  </h4>
                  <p className="text-xs text-zinc-700 leading-relaxed font-light">
                    {form.environment === "heavy_plant" || form.environment === "mining"
                      ? `RECOMENDADO: Extractor industrial tipo Blower con acople directo, turbina soldada de álabes atrasados de aluminio extruido y pintura epóxica antiácida para soportar el índice del ${severityScore}% de severidad.`
                      : form.environment === "data_center"
                        ? "RECOMENDADO: Sistema inyector silencioso de velocidad variable, filtros mecánicos plisados MERV 13 o HEPA, balanceado micrométrico láser y amortiguadores de vibración de resorte."
                        : "RECOMENDADO: Extractor axial de transmisión por poleas y correas, álabes regulables de aluminio y persiana de gravedad de apertura automática."}
                  </p>
                </div>

                {/* Precios Estimados */}
                <div className="p-5 border border-zinc-200 rounded-xl bg-zinc-50 grid gap-6 sm:grid-cols-2">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5 font-mono">
                      <DollarSign className="w-4 h-4 text-emerald-600" /> Presupuesto Estimado (COP)
                    </h4>
                    <div className="text-base font-bold text-zinc-900 font-mono">
                      {formatCurrency(realtimePrice.rangeMinCop)} - {formatCurrency(realtimePrice.rangeMaxCop)}
                    </div>
                    <p className="text-[9px] text-zinc-500 mt-1">
                      Margen de ±15% basado en dimensiones y urgencia.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5 font-mono">
                      <DollarSign className="w-4 h-4 text-sky-600" /> Equivalente Comercial (USD)
                    </h4>
                    <div className="text-base font-bold text-zinc-700 font-mono">
                      {formatUsd(realtimePrice.rangeMinUsd)} - {formatUsd(realtimePrice.rangeMaxUsd)}
                    </div>
                    <p className="text-[9px] text-zinc-500 mt-1">
                      Tasa conversión estática de $4,000 COP.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* PASO 5: EXITO CON GENERACIÓN CLIENT-SIDE PDF + WHATSAPP B2B */}
            {step === 5 && result && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-10 space-y-6"
              >
                <div className="w-16 h-16 bg-emerald-50 border border-emerald-250 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <FileCheck className="w-8 h-8" />
                </div>

                <div>
                  <h2 className="text-2xl font-black text-zinc-900 font-display uppercase tracking-wider">¡Preingeniería Registrada!</h2>
                  <p className="text-xs text-zinc-650 mt-2 max-w-md mx-auto leading-relaxed font-light">
                    Se ha generado su reporte de preingeniería. Un consultor técnico de <span className="text-sky-600 font-semibold">{siteName}</span> iniciará la validación comercial para contactarle en <span className="text-zinc-900 font-semibold">{form.ciudad}</span>.
                  </p>
                </div>

                {/* Ficha Resumen */}
                <div className="max-w-md mx-auto border border-zinc-200 rounded-xl p-5 bg-zinc-50 text-left space-y-3.5 text-xs shadow-xs">
                  <div className="flex justify-between border-b border-zinc-200 pb-2">
                    <span className="text-zinc-500 font-medium">Código Diagnóstico</span>
                    <span className="font-mono font-bold text-sky-600 tracking-wider">{result.diagnosticCode}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-200 pb-2">
                    <span className="text-zinc-500 font-medium">Caudal Calculado</span>
                    <span className="text-zinc-900 font-bold font-mono">{result.requiredCfm.toLocaleString()} CFM ({result.cfmCategory})</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-200 pb-2">
                    <span className="text-zinc-500 font-medium">Rango Presupuestal (COP)</span>
                    <span className="text-emerald-600 font-bold font-mono">
                      {formatCurrency(result.estimatedPriceMinCop)} - {formatCurrency(result.estimatedPriceMaxCop)}
                    </span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-zinc-500 font-medium">Rango Presupuestal (USD)</span>
                    <span className="text-sky-600 font-bold font-mono">
                      {formatUsd(result.estimatedPriceMinUsd)} - {formatUsd(result.estimatedPriceMaxUsd)}
                    </span>
                  </div>
                </div>

                {/* CTAS B2B: CLIENT-SIDE PDF + WHATSAPP */}
                <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                  <Button
                    onClick={generatePdfReport}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border border-zinc-200 hover:bg-zinc-100 bg-white text-xs font-bold uppercase tracking-wider text-zinc-700 cursor-pointer shadow-xs transition-colors"
                  >
                    <Download className="w-4 h-4 text-sky-600" /> Descargar PDF Reporte
                  </Button>
                  
                  <a
                    href={getWhatsAppLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ backgroundColor: primaryColor }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-white text-xs font-bold uppercase tracking-wider hover:opacity-90 hover:scale-[1.01] transition-all text-center shadow-xs"
                  >
                    <Send className="w-4 h-4" /> Enviar por WhatsApp
                  </a>
                </div>

                <div className="pt-6 border-t border-zinc-200 flex gap-4 justify-center text-xs">
                  <Link
                    href="/"
                    className="px-6 py-2 border border-zinc-200 hover:bg-zinc-105 rounded-lg text-zinc-600 transition-colors font-semibold bg-white shadow-xs"
                  >
                    Volver al Catálogo
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Lado HUD Técnico (40% o col-span-5) */}
        {step <= 4 && (
          <div className="lg:col-span-5 p-8 bg-zinc-50/50 space-y-6 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-zinc-200">
            <div>
              <div className="flex justify-between items-center border-b border-zinc-200 pb-3 mb-6">
                <span className="text-[10px] font-mono tracking-widest text-zinc-600 uppercase font-bold">Consola HUD de Ingeniería</span>
                <span className="text-[8px] bg-sky-50 text-sky-600 border border-sky-200 px-1.5 py-0.5 rounded font-mono font-bold">LIVE</span>
              </div>

              <div className="space-y-4">
                {/* Live CFM Ticker */}
                <div className="bg-white border border-zinc-200 p-4 rounded-xl relative overflow-hidden shadow-xs">
                  <div className="absolute top-0 right-0 h-full w-16 bg-gradient-to-l from-sky-500/5 to-transparent pointer-events-none" />
                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest font-mono block">Caudal Volumétrico</span>
                  <div className="text-2xl font-black text-zinc-900 font-mono mt-1">
                    {animatedCfm.toLocaleString()} <span className="text-xs text-zinc-500 font-normal">CFM</span>
                  </div>
                  <div className="text-[9px] text-zinc-500 font-mono mt-0.5">
                    ({Math.round(realtimeCfm.cubicMeters * 35.3147).toLocaleString()} Pies Cúbicos / Min)
                  </div>
                </div>

                {/* Volumen y Renovaciones */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white border border-zinc-200 p-3.5 rounded-xl shadow-xs">
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest font-mono block">Volumen Planta</span>
                    <div className="text-sm font-bold text-zinc-900 mt-1 font-mono">{Math.round(realtimeCfm.cubicMeters)} m³</div>
                  </div>
                  <div className="bg-white border border-zinc-200 p-3.5 rounded-xl shadow-xs">
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest font-mono block">Renovación (ACH)</span>
                    <div className="text-sm font-bold text-sky-600 mt-1 font-mono">
                      {form.environment === "heavy_plant" ? 35 : form.environment === "data_center" ? 25 : form.environment === "mining" ? 55 : form.environment === "warehouse" ? 12 : 10} ACH
                    </div>
                  </div>
                </div>

                {/* Severidad */}
                <div className="bg-white border border-zinc-200 p-3.5 rounded-xl space-y-2 shadow-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest font-mono">Severidad del Entorno</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                      severityLevel === "CRÍTICA" ? "bg-red-55 border border-red-200 text-red-700" :
                      severityLevel === "MODERADA" ? "bg-amber-55 border border-amber-200 text-amber-700" :
                      "bg-emerald-55 border border-emerald-200 text-emerald-700"
                    }`}>{severityLevel}</span>
                  </div>
                  <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        severityLevel === "CRÍTICA" ? "bg-red-600" :
                        severityLevel === "MODERADA" ? "bg-amber-500" :
                        "bg-emerald-500"
                      }`}
                      style={{ width: `${severityScore}%` }}
                    />
                  </div>
                </div>

                {/* Precios e Inversión */}
                <div className="bg-white border border-zinc-200 p-4 rounded-xl space-y-2 font-mono text-xs shadow-xs">
                  <div className="flex justify-between border-b border-zinc-100 pb-2">
                    <span className="text-zinc-500">Inversión Mínima:</span>
                    <span className="font-bold text-zinc-900">{formatCurrency(realtimePrice.rangeMinCop)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Inversión Máxima:</span>
                    <span className="font-bold text-zinc-900">{formatCurrency(realtimePrice.rangeMaxCop)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[9px] text-zinc-500 leading-relaxed font-mono pt-4 border-t border-zinc-200">
              * Los cálculos de inyección y extracción se actualizan automáticamente en tiempo real a 60fps basados en las dimensiones de la nave y la altitud del proyecto.
            </div>
          </div>
        )}

      </div>

      {/* Botonera de Control */}
      {step <= 4 && (
        <div className="bg-zinc-50 p-6 border-t border-zinc-200 flex justify-between">
          {step === 1 ? (
            <Link
              href="/"
              className="inline-flex items-center justify-center px-4 py-2 border border-zinc-250 rounded-lg text-zinc-650 hover:text-zinc-900 hover:bg-zinc-100 bg-white cursor-pointer text-xs font-bold transition-colors shadow-xs"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Catálogo
            </Link>
          ) : (
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isSubmitting}
              className="border-zinc-200 text-zinc-650 hover:text-zinc-900 hover:bg-zinc-50 bg-white cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Atrás
            </Button>
          )}

          {step < 4 ? (
            <Button
              onClick={handleNext}
              style={{ backgroundColor: primaryColor }}
              className="text-white hover:opacity-90 cursor-pointer font-bold shadow-xs hover:scale-[1.01] transition-all"
            >
              Siguiente <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={{ backgroundColor: primaryColor }}
              className="text-white hover:opacity-90 cursor-pointer font-bold shadow-xs hover:scale-[1.01] transition-all"
            >
              {isSubmitting ? "Registrando..." : "Confirmar & Solicitar Cotización"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
