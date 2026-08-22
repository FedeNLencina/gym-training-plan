import {
  TrainerInfo,
  Program,
  AppFeature,
  Testimonial,
  Transformation,
  PricingPlan,
  UserState
} from '../types';

export const TRAINER_INFO: TrainerInfo = {
  name: "Franco 'Atlas' Morales",
  role: "Head Coach & Fundador",
  gymName: "Atlas Gym & Performance Center",
  tagline: "Disciplina, Fuerza y Mentalidad.",
  subheadline: "Entrenamiento diseñado para quienes no negocian sus objetivos. Desarrolla fuerza real, hipertrofia funcional y una resistencia inquebrantable.",
  bio: "Con más de 12 años dedicados a la preparación física de alto rendimiento, powerlifting y biomecánica aplicada. Diseñé este sistema combinando la intensidad del entrenamiento presencial con la precisión de una plataforma digital para que progreses sesión tras sesión sin estancarte.",
  stats: [
    { value: "+1,200", label: "Alumnos Entrenados" },
    { value: "12+", label: "Años de Experiencia" },
    { value: "98%", label: "Tasa de Consistencia" },
    { value: "4.9/5", label: "Calificación Promedio" }
  ],
  gymDetails: {
    address: "Av. Corrientes 4550, Almagro, CABA",
    hours: "Lunes a Viernes 06:30 a 22:00 hs | Sábados 08:00 a 16:00 hs",
    whatsapp: "+54 9 11 5555-8899",
    instagram: "@atlasgym.arg",
    amenities: [
      "Área de Fuerza y Racks Olímpicos",
      "Zona de Calistenia y Peso Corporal",
      "Pista de Trineos y Zona Funcional",
      "Vestuarios Completos y Lockers",
      "Bar de Nutrición e Hidratación"
    ]
  }
};

export const PROGRAMS: Program[] = [
  {
    id: "atlas-hybrid-strength",
    title: "Atlas Hybrid Strength",
    category: "Fuerza e Hipertrofia",
    durationWeeks: 8,
    frequency: "4 Días / Semana",
    level: "Intermedio - Avanzado",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200&auto=format&fit=crop",
    shortDescription: "Un programa de 8 semanas diseñado para construir fuerza máxima en básicos, ganar masa muscular limpia y potenciar tu rendimiento atlético.",
    tags: ["Fuerza", "Hipertrofia", "Gimnasio", "Rendimiento"],
    sessionsCount: 32,
    weeks: [
      {
        weekNumber: 1,
        title: "Semana 1: Adaptación y Sobrecarga Base",
        days: [
          {
            dayNumber: 1,
            title: "Día 1: Torso Pesado (Empuje y Tracción)",
            focus: "Pecho, Espalda y Hombros",
            estimatedDuration: "60 min",
            exercises: [
              {
                id: "ex-1",
                name: "Press de Banca Plano con Barra",
                muscle: "Pectoral Mayor, Tríceps",
                equipment: "Barra Olímpica + Banco",
                videoUrl: "https://www.youtube-nocookie.com/embed/rT7DgCr-3pg",
                thumbnail: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=600&auto=format&fit=crop",
                tips: "Pies firmes en el suelo, retracción escapular activa y trayectoria en suave arco.",
                suggestedSets: 4,
                suggestedReps: "6-8",
                suggestedRestSeconds: 90,
                defaultWeight: 70
              },
              {
                id: "ex-2",
                name: "Remo con Barra Pendlay",
                muscle: "Dorsal Ancho, Trapecio",
                equipment: "Barra Olímpica",
                videoUrl: "https://www.youtube-nocookie.com/embed/G8l_8chR5BE",
                thumbnail: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=600&auto=format&fit=crop",
                tips: "Espalda paralela al piso en cada repetición. Explosividad al subir, control al bajar.",
                suggestedSets: 4,
                suggestedReps: "8",
                suggestedRestSeconds: 90,
                defaultWeight: 65
              },
              {
                id: "ex-3",
                name: "Press Militar de Pie",
                muscle: "Deltoides, Core",
                equipment: "Barra Olímpica",
                videoUrl: "https://www.youtube-nocookie.com/embed/2yjwXTZQDDI",
                thumbnail: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=600&auto=format&fit=crop",
                tips: "Glúteos apretados, core bloqueado, barra pasa rozando la nariz.",
                suggestedSets: 3,
                suggestedReps: "8-10",
                suggestedRestSeconds: 75,
                defaultWeight: 40
              },
              {
                id: "ex-4",
                name: "Dominadas Lastradas / Libres",
                muscle: "Espalda, Bíceps",
                equipment: "Barra de Dominadas",
                videoUrl: "https://www.youtube-nocookie.com/embed/eGo4IYlbE5g",
                thumbnail: "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?q=80&w=600&auto=format&fit=crop",
                tips: "Rango completo: mentón supera la barra y brazos extendidos al bajar.",
                suggestedSets: 3,
                suggestedReps: "Max / 8",
                suggestedRestSeconds: 75,
                defaultWeight: 0
              }
            ]
          },
          {
            dayNumber: 2,
            title: "Día 2: Pierna y Potencia (Sentadilla)",
            focus: "Cuádriceps, Isquios y Core",
            estimatedDuration: "65 min",
            exercises: [
              {
                id: "ex-5",
                name: "Sentadilla Trasera Profunda",
                muscle: "Cuádriceps, Glúteos",
                equipment: "Rack + Barra Olímpica",
                videoUrl: "https://www.youtube-nocookie.com/embed/bEv6CCg2BC8",
                thumbnail: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=600&auto=format&fit=crop",
                tips: "Rodillas hacia afuera, cadera por debajo de la paralela, pecho arriba.",
                suggestedSets: 4,
                suggestedReps: "6-8",
                suggestedRestSeconds: 120,
                defaultWeight: 90
              },
              {
                id: "ex-6",
                name: "Peso Muerto Rumano",
                muscle: "Isquiosurales, Glúteo Mayor",
                equipment: "Mancuernas / Barra",
                videoUrl: "https://www.youtube-nocookie.com/embed/jEy_czb3RKA",
                thumbnail: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600&auto=format&fit=crop",
                tips: "Cadera viaja hacia atrás, espalda neutra, estiramiento profundo de isquios.",
                suggestedSets: 3,
                suggestedReps: "10-12",
                suggestedRestSeconds: 90,
                defaultWeight: 60
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "pull-up-and-calisthenics",
    title: "Mastery Calistenia & Pull Up",
    category: "Calistenia & Peso Corporal",
    durationWeeks: 6,
    frequency: "3 Días / Semana",
    level: "Todos los Niveles",
    image: "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?q=80&w=1200&auto=format&fit=crop",
    shortDescription: "Domina el control de tu peso corporal. Desde tu primera dominada estricta hasta fondos y ejercicios avanzados de estabilidad.",
    tags: ["Calistenia", "Peso Corporal", "Fuerza Relativa", "Sin Máquinas"],
    sessionsCount: 18,
    weeks: [
      {
        weekNumber: 1,
        title: "Semana 1: Activación Escapular y Fuerza de Agarre",
        days: [
          {
            dayNumber: 1,
            title: "Día 1: Dominadas y Tracciones",
            focus: "Espalda y Brazos",
            estimatedDuration: "45 min",
            exercises: [
              {
                id: "ex-c1",
                name: "Dominadas Escapulares",
                muscle: "Trapecio Inferior, Dorsal",
                equipment: "Barra de Dominadas",
                videoUrl: "https://www.youtube-nocookie.com/embed/eGo4IYlbE5g",
                thumbnail: "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?q=80&w=600&auto=format&fit=crop",
                tips: "Brazos rectos, elevar el cuerpo solo deprimiendo las escápulas.",
                suggestedSets: 4,
                suggestedReps: "10",
                suggestedRestSeconds: 60,
                defaultWeight: 0
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "mobility-and-core-resilience",
    title: "Movilidad Articular & Core",
    category: "Movilidad y Recuperación",
    durationWeeks: 4,
    frequency: "Daily / 15-20 min",
    level: "Principiante a Avanzado",
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1200&auto=format&fit=crop",
    shortDescription: "Elimina rigideces, previene lesiones en hombros y caderas y fortalece la zona media para soportar cargas pesadas de forma segura.",
    tags: ["Movilidad", "Core", "Salud Articular", "Longevidad"],
    sessionsCount: 28,
    weeks: []
  },
  {
    id: "functional-fat-burn",
    title: "Atlas Conditioning & Shred",
    category: "Resistencia y Quema Grasa",
    durationWeeks: 6,
    frequency: "4 Días / Semana",
    level: "Intermedio",
    image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1200&auto=format&fit=crop",
    shortDescription: "Metcon de alta densidad y fuerza funcional. Diseñado para acelerar el metabolismo y quemar grasa manteniendo la masa muscular.",
    tags: ["Metcon", "HIIT", "Definición", "Potencia"],
    sessionsCount: 24,
    weeks: []
  }
];

export const APP_FEATURES: AppFeature[] = [
  {
    id: "feat-1",
    title: "Guías en Video HD",
    description: "Cada ejercicio incluye demostraciones en video y tips clave de biomecánica para ejecutar con técnica perfecta.",
    icon: "Video"
  },
  {
    id: "feat-2",
    title: "Registro de Cargas & PRs",
    description: "Anota tus pesos y repeticiones en tiempo real. La app recuerda automáticamente tus mejores marcas históricas.",
    icon: "Dumbbell"
  },
  {
    id: "feat-3",
    title: "Temporizador de Descanso",
    description: "Controla tus pausas entre series con alertas visuales y sonoras sin salir de la pantalla de entrenamiento.",
    icon: "Timer"
  },
  {
    id: "feat-4",
    title: "Rachas & Consistencia",
    description: "Construye el hábito día a día con el contador de rachas activas y el resumen mensual de sesiones cumplidas.",
    icon: "Flame"
  },
  {
    id: "feat-5",
    title: "Soporte PWA / Instalable",
    description: "Instala la app directamente en tu teléfono (iOS o Android) como una app nativa con carga ultra rápida.",
    icon: "Smartphone"
  },
  {
    id: "feat-6",
    title: "Comunidad Atlas",
    description: "Conecta con compañeros de entrenamiento, comparte tus logros y recibe feedback directo de los entrenadores.",
    icon: "Users"
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    name: "Mariano S.",
    role: "Alumno Programa Híbrido",
    rating: 5,
    quote: "Pasé de estancarme con 80kg en banco a meter 110kg en 3 meses. Las explicaciones en video y el tracking de pesos cambian el juego por completo.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop"
  },
  {
    name: "Camila R.",
    role: "Alumna Presencial + App",
    rating: 5,
    quote: "Entrenar en Atlas Gym y llevar la rutina en la app es la combinación perfecta. Todo organizado, no pierdo tiempo pensando qué me toca hacer hoy.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop"
  },
  {
    name: "Lucas V.",
    role: "Alumno Online",
    rating: 5,
    quote: "Vivo en el interior y entrenar con el plan de Franco me dio una estructura que ningún gimnasio local me había brindado. Super recomendado.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop"
  }
];

export const TRANSFORMATIONS: Transformation[] = [
  {
    name: "Ezequiel M.",
    result: "-12 kg de grasa & +6 kg masa muscular",
    duration: "16 Semanas",
    image: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=600&auto=format&fit=crop"
  },
  {
    name: "Sofía T.",
    result: "De 0 a 8 Dominadas Estrictas & Fuerza Total",
    duration: "12 Semanas",
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=600&auto=format&fit=crop"
  },
  {
    name: "Joaquín B.",
    result: "+40 kg en Sentadilla & Espalda Blindada",
    duration: "24 Semanas",
    image: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=600&auto=format&fit=crop"
  }
];

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "online-monthly",
    name: "Plan App Digital",
    type: "Mensual",
    price: "$ 18.500",
    period: "ARS / mes",
    subtitle: "Para entrenar en cualquier gimnasio con la app",
    badge: "100% Digital",
    isPopular: false,
    features: [
      "Acceso completo a todos los programas",
      "Videos demostrativos en HD y tips técnicos",
      "Registro ilimitado de cargas, repeticiones y PRs",
      "Temporizador y descansos inteligentes",
      "Actualizaciones continuas de rutinas"
    ],
    ctaText: "Comenzar Ahora"
  },
  {
    id: "hybrid-gym-pass",
    name: "Pase Full Gym + App",
    type: "Presencial + Digital",
    price: "$ 38.000",
    period: "ARS / mes",
    subtitle: "Entrena en nuestras instalaciones de Atlas Gym",
    badge: "Más Elegido",
    isPopular: true,
    features: [
      "Acceso libre e ilimitado a Atlas Gym (Almagro)",
      "App Digital incluida con todos los programas",
      "Asesoramiento y corrección presencial por coaches",
      "Evaluación física y test de fuerza mensual",
      "Descuento en bar de suplementación y eventos"
    ],
    ctaText: "Unirme al Gimnasio"
  },
  {
    id: "online-annual",
    name: "Pase Anual Digital",
    type: "Anual",
    price: "$ 14.900",
    period: "ARS / mes (Facturado anual)",
    subtitle: "Compromiso total con 2 meses bonificados",
    badge: "Ahorra 25%",
    isPopular: false,
    features: [
      "Todo lo incluido en el Plan App Digital",
      "2 Meses de acceso gratis incluidos",
      "Soporte prioritario por WhatsApp con Franco",
      "Revisión trimestral de videos de técnica",
      "Acceso anticipado a nuevos programas"
    ],
    ctaText: "Asegurar Plan Anual"
  }
];

export const INITIAL_USER_STATE: UserState = {
  name: "Federico",
  avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop",
  streakDays: 14,
  workoutsCompletedThisMonth: 12,
  activeProgramId: "atlas-hybrid-strength",
  currentWeek: 1,
  currentDay: 1,
  recentPRs: [
    { exercise: "Press de Banca", weight: "85 kg", date: "Ayer" },
    { exercise: "Sentadilla Trasera", weight: "120 kg", date: "Hace 4 días" },
    { exercise: "Peso Muerto", weight: "150 kg", date: "La semana pasada" }
  ]
};
