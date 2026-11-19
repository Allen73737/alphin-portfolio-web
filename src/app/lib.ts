import { useState, useEffect, useRef, useCallback } from "react";
import {
  motion, useScroll, useTransform, useSpring,
  useMotionValue, useInView, AnimatePresence, useMotionTemplate,
  type MotionValue,
} from "motion/react";
import Lenis from "lenis";
import { t, onLang } from "./i18n";
import { ArrowUpRight, Github, Linkedin, Mail, ExternalLink } from "lucide-react";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import alphinPhoto from "@/imports/Picture3.png";
import alphinCV from "@/imports/AlphinFrancis.pdf";
import alphinCVPage1 from "@/imports/AlphinFrancis-page-1.png";
import alphinCVPage2 from "@/imports/AlphinFrancis-page-2.png";
import { type V3, type Face, type Cam, m3T, m3Ry, m3Rx, m3Rz, m3Mul, m3P, v3Sub, v3Dot, v3Norm, addBox, addCyl, makeCam, proj, runCanvas } from "@/app/components/robot3d/engine";
import { Preloader3D, RobotShowcase, RobotHeadCompanion } from "@/app/components/robot3d/robots";



/* ─── CONSTANTS ──────────────────────────────────────────────────── */
export const BG  = "'Bricolage Grotesque', sans-serif";
export const MN  = "'DM Mono', monospace";
export const BODY = "'Inter', system-ui, sans-serif";
export const BRD = "rgba(255,255,255,0.065)";
export const LIGHT_BG = "#eeeae3";
export const NOISE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;
export const SC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+-./=∑∇∫ΩΔΠ";

export function useMediaQuery(query:string) {
  const [match,setMatch]=useState(()=>typeof window!=="undefined"&&window.matchMedia(query).matches);
  useEffect(()=>{
    const mq=window.matchMedia(query);
    const fn=()=>setMatch(mq.matches);
    fn();mq.addEventListener("change",fn);
    return()=>mq.removeEventListener("change",fn);
  },[query]);
  return match;
}
export function useLowPowerMode() {
  const reduced=useMediaQuery("(prefers-reduced-motion: reduce)");
  const compact=useMediaQuery("(max-width: 767px)");
  const [limited,setLimited]=useState(false);
  useEffect(()=>{
    const nav=navigator as Navigator&{deviceMemory?:number;connection?:{saveData?:boolean}};
    setLimited((nav.deviceMemory??8)<4||(nav.hardwareConcurrency??8)<4||Boolean(nav.connection?.saveData));
  },[]);
  return reduced||compact||limited;
}

/* simple mode flag, read at render time; the App re-mounts the page when it flips */
export let SIMPLE=(()=>{try{return localStorage.getItem("simple")==="1";}catch{return false;}})();
export const setSimpleFlag=(v:boolean)=>{SIMPLE=v;};

/* shared smooth-scroll instance so every scroll goes through Lenis when active */
export const lenisRef:{current:Lenis|null}={current:null};
export function scrollToTarget(target:HTMLElement|number,immediate=false) {
  const l=lenisRef.current;
  if(l){l.scrollTo(target,{immediate,force:true});return;}
  if(typeof target==="number")window.scrollTo({top:target,behavior:immediate?"auto":"smooth"});
  else target.scrollIntoView({block:"start",behavior:immediate?"auto":"smooth"});
}

/* ─── DATA — rebuilt on language change (exports are live bindings) ─ */
const buildRoles=()=>[
  t("Robotics & Automation Engineer","Robotik- & Automatisierungsingenieur"),
  t("Vision Systems Integrator","Integrator für Bildverarbeitung"),
  t("Industrial Robot Programmer","Industrieroboter-Programmierer"),
  t("Simulation & Commissioning Engineer","Ingenieur für Simulation & Inbetriebnahme"),
];
const buildProjects=()=>[
  { num:"01", title:t("Mobile Manipulator Cleaning Validation","Reinigungsvalidierung mit mobilem Manipulator"), short:t("Cleaning Validation","Reinigungsvalidierung"), type:t("Mobile Manipulation · Pharmaceutical Lab","Mobile Manipulation · Pharmalabor"), year:t("ONGOING","LAUFEND"), spec:t("Master Thesis","Masterarbeit"), desc:t("Automating pharmaceutical cleaning validation with a mobile manipulator and environment CAD data. Robotic motion, sensing, and test procedures are integrated into a reliable, repeatable workflow.","Automatisierung der pharmazeutischen Reinigungsvalidierung mit einem mobilen Manipulator und CAD-Daten der Umgebung. Roboterbewegung, Sensorik und Prüfabläufe werden zu einem zuverlässigen, reproduzierbaren Workflow verbunden."), img:"photo-1485827404703-89b55fcc595e", tags:["Mobile Manipulator","Python","CAD",t("Validation","Validierung")] },
  { num:"02", title:t("Robotic Manipulator","Robotermanipulator"), short:t("Robotic Manipulator","Robotermanipulator"), type:t("Multi-axis Motion · Simulation","Mehrachsbewegung · Simulation"), year:t("ACADEMIC","STUDIUM"), spec:"MATLAB · ROS · Ubuntu", desc:t("Programmed multi-axis robotic manipulator motion and validated robot behavior using MATLAB, ROS, RViz, and Gazebo on Ubuntu.","Mehrachsige Manipulatorbewegungen programmiert und das Roboterverhalten mit MATLAB, ROS, RViz und Gazebo unter Ubuntu validiert."), img:"photo-1518770660439-4636190af475", tags:["MATLAB","ROS1","RViz","Gazebo"] },
  { num:"03", title:t("Mobile Robots","Mobile Roboter"), short:t("Mobile Robots","Mobile Roboter"), type:t("Navigation · Planning · SLAM","Navigation · Planung · SLAM"), year:t("ACADEMIC","STUDIUM"), spec:"ROS · MATLAB", desc:t("Implemented obstacle avoidance, homing, path following, path planning, and SLAM for mobile robot platforms across ROS and MATLAB environments.","Hindernisvermeidung, Homing, Pfadverfolgung, Pfadplanung und SLAM für mobile Roboterplattformen in ROS und MATLAB umgesetzt."), img:"photo-1563770660941-10051e90e70e", tags:["SLAM",t("Path Planning","Pfadplanung"),"ROS1","MATLAB"] },
  { num:"04", title:t("Voice Assistant Chatbot","Sprachassistent-Chatbot"), short:t("Voice Assistant","Sprachassistent"), type:t("Conversational AI · Speech","Dialog-KI · Sprache"), year:t("PROTOTYPE","PROTOTYP"), spec:"Hugging Face Models", desc:t("Built a voice assistant chatbot using Faster Whisper for speech recognition and Coqui XTTS for neural text-to-speech synthesis.","Einen Sprachassistenten entwickelt – mit Faster Whisper für die Spracherkennung und Coqui XTTS für neuronale Sprachsynthese."), img:"photo-1555255707-c07966088b7b", tags:["Faster Whisper","Coqui XTTS","Hugging Face","Python"] },
  { num:"05", title:t("Weight Regulation for Trucks","Gewichtsregelung für Lkw"), short:t("Truck Load Regulation","Lkw-Lastregelung"), type:t("Embedded Mechatronics · Safety","Embedded-Mechatronik · Sicherheit"), year:t("PROTOTYPE","PROTOTYP"), spec:t("Arduino · Sensors","Arduino · Sensorik"), desc:t("Designed and built a prototype combining Arduino, a servo motor, and load-sensor technology to detect and regulate overloading for improved efficiency and road safety.","Prototyp aus Arduino, Servomotor und Wägezellen konstruiert und gebaut, der Überladung erkennt und regelt – für mehr Effizienz und Verkehrssicherheit."), img:"photo-1519003722824-194d4455a60c", tags:["Arduino",t("Servo Motor","Servomotor"),t("Load Sensor","Wägezelle"),t("Prototype","Prototyp")] },
];
const buildSkills=()=>[
  { label:t("Robotics","Robotik"),        score:0.95, items:["Universal Robots","Stäubli · VAL3","URScript","UR RTDE","TX2-140"] },
  { label:t("Vision","Bildverarbeitung"), score:0.90, items:["OpenCV","Open3D","RealSense","CubeEye","SensoPart"] },
  { label:"Simulation",                   score:0.85, items:["ROS1 · Gazebo","RViz","RoboDK","VTK","Fusion 360 · Blender"] },
  { label:t("Programming","Programmierung"), score:0.88, items:["Python","C++","MATLAB","Linux","GitLab"] },
];
const buildTimeline=()=>[
  { year:t("10.25—NOW","10.25—HEUTE"), role:t("Robotics Engineer – Intern","Robotikingenieur – Praktikant"), org:t("Invite GmbH · Germany","Invite GmbH · Deutschland"), detail:t("Developing repeatable mobile-manipulator workflows for cleaning validation with environment CAD data. Delivered RoX vision-guided powder dosing with QR identification and SensoPart integration; programmed Stäubli workspace logic in VAL3, validated concepts in Robotics Suite, prototyped parts in Fusion 360, and authored commissioning documentation.","Entwicklung reproduzierbarer Workflows mit mobilem Manipulator für die Reinigungsvalidierung auf Basis von CAD-Umgebungsdaten. Bildgestützte RoX-Pulverdosierung mit QR-Identifikation und SensoPart-Integration umgesetzt; Stäubli-Arbeitsraumlogik in VAL3 programmiert, Konzepte in der Robotics Suite validiert, Bauteile in Fusion 360 prototypisiert und Inbetriebnahmedokumentation erstellt.") },
  { year:"10.24—10.25", role:t("Working Student – Robotics","Werkstudent – Robotik"), org:"Fraunhofer IWU", detail:t("Integrated Intel RealSense and CubeEye perception hardware with OpenCV and Open3D across UR10 and UR20 platforms. Supported a robotic demo-cell through a full year of testing and troubleshooting, while building DH/MDH kinematic databases with VTK visualization.","Intel-RealSense- und CubeEye-Sensorik mit OpenCV und Open3D auf UR10- und UR20-Plattformen integriert. Eine Roboter-Demozelle ein ganzes Jahr lang bei Tests und Fehlersuche betreut und DH/MDH-Kinematikdatenbanken mit VTK-Visualisierung aufgebaut.") },
  { year:"10.22—01.27", role:t("M.Sc. Automation & Robotics","M.Sc. Automation & Robotics"), org:"TU Dortmund", detail:t("Focus: modelling and control of robotic manipulators, automated driving, networked mobile robotic systems, computer vision, mobile robotics, and machine learning in robotics. Master thesis centers on mobile-manipulator cleaning validation.","Schwerpunkte: Modellierung und Regelung von Robotermanipulatoren, automatisiertes Fahren, vernetzte mobile Robotersysteme, Computer Vision, mobile Robotik und maschinelles Lernen in der Robotik. Die Masterarbeit behandelt die Reinigungsvalidierung mit mobilem Manipulator.") },
  { year:"08.17—07.21", role:t("B.Tech Mechatronics Engineering","B.Tech Mechatronik"), org:"APJ Abdul Kalam Technological University", detail:t("Thesis: Automatic Data Logging Using QR-code System. Focus modules included sensors and actuators, MEMS, robotics, digital manufacturing, and PLC systems.","Abschlussarbeit: Automatische Datenerfassung mit QR-Code-System. Schwerpunktmodule: Sensoren und Aktoren, MEMS, Robotik, digitale Fertigung und SPS-Systeme.") },
];
const buildPhases=()=>[
  { id:"SYS-01", title:t("Perceive","Wahrnehmen"), meta:t("CAMERAS · DEPTH · POINT CLOUDS","KAMERAS · TIEFE · PUNKTWOLKEN"), body:t("Industrial cameras and depth sensors become calibrated, testable perception pipelines using OpenCV, Open3D, RealSense, CubeEye, and SensoPart.","Industriekameras und Tiefensensoren werden zu kalibrierten, testbaren Wahrnehmungs-Pipelines – mit OpenCV, Open3D, RealSense, CubeEye und SensoPart.") },
  { id:"SYS-02", title:t("Plan & Simulate","Planen & Simulieren"), meta:t("KINEMATICS · COLLISION · FEASIBILITY","KINEMATIK · KOLLISION · MACHBARKEIT"), body:t("Robot behavior is modelled before deployment through DH/MDH data, ROS, Gazebo, RViz, RoboDK, VTK, and Stäubli Robotics Suite.","Das Roboterverhalten wird vor dem Einsatz modelliert – mit DH/MDH-Daten, ROS, Gazebo, RViz, RoboDK, VTK und der Stäubli Robotics Suite.") },
  { id:"SYS-03", title:t("Deploy & Validate","Inbetriebnehmen & Validieren"), meta:t("TEST SCRIPTS · COMMISSIONING · HANDOVER","TESTSKRIPTE · INBETRIEBNAHME · ÜBERGABE"), body:t("Workflows move from simulation to reliable operation through workspace validation, troubleshooting, repeatability testing, and structured documentation.","Workflows gehen von der Simulation in den zuverlässigen Betrieb – durch Arbeitsraumvalidierung, Fehlersuche, Wiederholgenauigkeitstests und strukturierte Dokumentation.") },
];
export let ROLES=buildRoles();
export let PROJECTS=buildProjects();
export let SKILLS_DOMAINS=buildSkills();
export let TIMELINE=buildTimeline();
export let AUTOMATION_PHASES=buildPhases();
onLang(()=>{
  ROLES=buildRoles();PROJECTS=buildProjects();SKILLS_DOMAINS=buildSkills();
  TIMELINE=buildTimeline();AUTOMATION_PHASES=buildPhases();
});