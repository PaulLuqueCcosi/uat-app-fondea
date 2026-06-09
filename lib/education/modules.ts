import type { EducationModule } from './types';

/**
 * Data estática de los 7 módulos de educación financiera.
 *
 * Cuando se conecte un CMS, este archivo se reemplaza por un fetch.
 * La estructura (interface EducationModule) se mantiene igual.
 */
export const modules: EducationModule[] = [
  {
    id: 'credito-interes',
    order: 1,
    title: '¿Qué es el crédito y el interés?',
    mascot: 'buho',
    description:
      'Entiende cómo funcionan las tasas de interés, la diferencia entre TEA y TCEA, y por qué importa saber cuánto realmente pagas por un préstamo.',
    thumbnail:
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop',
    videoUrl: 'https://www.youtube.com/embed/PHe0bXAIuk0',
    videoDuration: '3:12',
    videoTitle: 'TEA vs TCEA: La diferencia que nadie te explica',
    bodyParagraphs: [
      'Cuando pides un préstamo, no solo devuelves el dinero que te prestaron: pagas un costo adicional llamado interés. Ese interés es, en esencia, el "precio" de usar dinero que no es tuyo durante un tiempo determinado. Parece simple, pero la forma en que se calcula puede cambiar enormemente cuánto terminas pagando.',
      'En Perú existen dos tasas que debes conocer. La TEA (Tasa Efectiva Anual) mide únicamente el interés puro que cobra la entidad financiera. Pero hay otra cifra más importante: la TCEA (Tasa de Costo Efectivo Anual), que incluye absolutamente TODO lo que pagas — intereses, comisiones, seguros obligatorios, portes y cualquier otro cargo. La TCEA es la cifra real y la que deberías comparar siempre entre opciones.',
      'Pongamos un ejemplo concreto: si pides S/ 1,000 a 30 días con una TEA de 80%, podrías pensar que el costo mensual es razonable. Pero cuando miras la TCEA (que podría ser 120% por los cargos adicionales), descubres que el costo real del mes es cercano a S/ 100. Esa diferencia de percepción es exactamente por la que muchas personas se endeudan más de lo que planeaban.',
      'La buena noticia: la SBS obliga a TODAS las entidades financieras reguladas a publicar su TCEA de forma transparente. Antes de firmar cualquier contrato, pregunta siempre por esta tasa. Y recuerda: el interés se calcula sobre el saldo pendiente, no sobre el monto original. Eso significa que mientras más rápido pagues, menos interés generas en total.',
    ],
    summaryPoints: [
      'La TCEA incluye TODOS los costos del préstamo (intereses + comisiones + seguros + portes). Siempre compara por TCEA, nunca por TEA sola.',
      'El interés se calcula sobre el saldo pendiente. Pagar antes = pagar menos interés total.',
      'La SBS obliga a publicar la TCEA. Exígela antes de firmar cualquier contrato.',
      'Un microcrédito de S/ 1,000 con TCEA de 120% anual cuesta ~S/ 100 al mes. Conoce el costo ANTES de pedir.',
    ],
    downloadUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    downloadLabel: 'Infografía: Si pides S/ 1,000 ¿cuánto pagas realmente?',
    externalLinks: [
      {
        institution: 'BCP',
        label: 'Campus ABC del BCP — Curso gratuito de finanzas',
        url: 'https://www.viabcp.com/campus-abc',
      },
      {
        institution: 'Khan Academy',
        label: 'Economía y Finanzas Personales (en español)',
        url: 'https://es.khanacademy.org/economics-finance-domain/core-finance',
      },
      {
        institution: 'SBS Perú',
        label: 'Finanzas para Ti — Portal oficial de educación financiera',
        url: 'https://www.sbs.gob.pe/educacion-financiera',
      },
      {
        institution: 'CFPB (EE.UU.)',
        label: 'Consumer Financial Protection Bureau — Credit Reports',
        url: 'https://www.consumerfinance.gov/',
      },
    ],
  },
  {
    id: 'reputacion-financiera',
    order: 2,
    title: 'Tu Reputación Financiera',
    mascot: 'buho',
    description:
      'Tu historial crediticio es tu carta de presentación ante el sistema financiero. Aprende a leer tu reporte, entender tu score y mejorar tu calificación.',
    thumbnail:
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=400&fit=crop',
    videoUrl: 'https://www.youtube.com/embed/PHe0bXAIuk0',
    videoDuration: '2:45',
    videoTitle: 'Centrales de Riesgo y Score Crediticio: Lo que debes saber',
    bodyParagraphs: [
      'Cada vez que pides un crédito, pagas una cuota, te atrasas un día o cancelas una deuda, esa información queda registrada en las centrales de riesgo. En Perú, las principales son Sentinel (de Equifax) y Experian. Estas empresas recopilan tu historial financiero y lo convierten en un perfil que CUALQUIER entidad puede consultar antes de prestarte dinero.',
      'Tu perfil se resume en dos cosas: una calificación de la SBS y un score numérico. La calificación SBS tiene 5 niveles — Normal significa que estás al día (0-8 días de atraso máximo), CPP que tienes problemas potenciales (9-30 días), Deficiente (31-60 días), Dudoso (61-120 días) y Pérdida (más de 120 días). Pasar de Normal a CPP te cierra muchas puertas.',
      'El Score de Sentinel es un número entre 0 y 999 que resume tu comportamiento financiero. Arriba de 700 es bueno, arriba de 800 es excelente. Debajo de 500, la mayoría de entidades formales te rechazarán automáticamente. Este número no solo depende de si pagas o no — también considera cuánto crédito usas, hace cuánto tienes historial, y la diversidad de tus cuentas.',
      'Un dato que pocos saben: tu reputación NO se construye evitando el crédito. Se construye USANDO crédito de forma responsable y pagando siempre a tiempo. Alguien sin historial crediticio es casi tan "riesgoso" para una entidad como alguien con historial malo, porque no hay datos para evaluar. Por eso, usar FONDEA responsablemente es una forma de construir tu reputación financiera.',
    ],
    summaryPoints: [
      'Las centrales de riesgo registran TODA tu actividad: cada pago puntual suma, cada atraso resta.',
      'Calificación SBS: Normal (0-8 días) → CPP (9-30) → Deficiente (31-60) → Dudoso (61-120) → Pérdida (+120).',
      'Score Sentinel: 0-999. Arriba de 700 = bueno. Arriba de 800 = excelente. Debajo de 500 = puertas cerradas.',
      'Tu score se construye USANDO crédito responsablemente, no evitándolo.',
      'Consulta tu reporte gratis una vez al año en la SBS. Si hay errores, reclama.',
    ],
    downloadUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    downloadLabel: 'Guía visual: Cómo leer tu semáforo de riesgo SBS',
    externalLinks: [
      {
        institution: 'SBS Perú',
        label: 'Portal de Educación Financiera — Consulta tu reporte',
        url: 'https://www.sbs.gob.pe/educacion-financiera',
      },
      {
        institution: 'Mi Sentinel (Equifax)',
        label: 'Consulta tu score y reporte crediticio',
        url: 'https://misentinel.com.pe/',
      },
      {
        institution: 'Visa',
        label: 'Finanzas Prácticas — Historial crediticio',
        url: 'https://www.finanzaspracticas.com/',
      },
      {
        institution: 'Banco Mundial',
        label: 'Financial Capability Resources',
        url: 'https://www.worldbank.org/',
      },
    ],
  },
  {
    id: 'costo-mora',
    order: 3,
    title: 'El Costo Real de la Mora',
    mascot: 'buho',
    description:
      'Un solo día de atraso puede costarte mucho más que la penalidad. Entiende las consecuencias reales y cómo un atraso afecta tu futuro financiero.',
    thumbnail:
      'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&h=400&fit=crop',
    videoUrl: 'https://www.youtube.com/embed/PHe0bXAIuk0',
    videoDuration: '2:30',
    videoTitle: 'Atrasarte 1 día en FONDEA: Esto es lo que pasa',
    bodyParagraphs: [
      'Muchas personas piensan que atrasarse "un par de días" no tiene consecuencias graves. La realidad es muy diferente. En el sistema financiero peruano, cada día de atraso activa una cadena de eventos que pueden afectar tu vida financiera durante años. No es exageración — es cómo funciona el sistema.',
      'El primer impacto es económico: desde el día 1 de atraso se aplica una penalidad sobre tu cuota pendiente. En FONDEA, este cargo adicional es proporcional al monto y se acumula cada día. Pero esto es solo el comienzo y, honestamente, es el menor de los problemas.',
      'El segundo impacto es reputacional: a partir del día 5, tu atraso se reporta a Sentinel y Equifax. Desde ese momento, CUALQUIER banco, financiera, tienda o empresa de telefonía que consulte tu historial verá ese atraso. Tu score baja inmediatamente, y recuperarlo toma meses de comportamiento impecable.',
      'El tercer impacto es el más costoso a largo plazo: la pérdida de oportunidades. Con calificación CPP o peor, las tasas que te ofrecen suben drásticamente, los montos que te aprueban bajan, y muchas entidades simplemente te rechazan automáticamente. Esa hipoteca, ese préstamo vehicular, esa tarjeta de crédito con buen límite — todo se aleja. Y no por meses, sino por años. En FONDEA creemos en la transparencia total: queremos que sepas exactamente qué pasa si te atrasas, para que tomes decisiones informadas.',
    ],
    summaryPoints: [
      'Día 1: Penalidad económica automática proporcional al monto pendiente.',
      'Día 5: Reporte a Sentinel/Equifax. Tu score crediticio baja inmediatamente.',
      'Día 15: Bloqueo de línea de crédito en FONDEA. Pierdes tu nivel en el Pasaporte Financiero.',
      'Día 30+: Tu calificación SBS cambia de Normal a CPP. Consecuencias por mínimo 2 años.',
      'El costo REAL no es la penalidad — es el costo de oportunidad: tasas más altas y menos opciones por años.',
    ],
    downloadUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    downloadLabel: 'Tabla completa: Consecuencias por días de atraso (día 1 al día 120)',
    externalLinks: [
      {
        institution: 'SBS Perú',
        label: 'Derechos y Deberes del Usuario Financiero',
        url: 'https://www.sbs.gob.pe/educacion-financiera',
      },
      {
        institution: 'Mi Sentinel',
        label: 'Cómo afecta la mora a tu reporte crediticio',
        url: 'https://misentinel.com.pe/',
      },
      {
        institution: 'Finanzas para Todos (España)',
        label: 'Portal de educación del Banco de España y CNMV',
        url: 'https://www.finanzasparatodos.es/',
      },
      {
        institution: 'OECD',
        label: 'Financial Literacy Resources',
        url: 'https://www.oecd.org/financial/education/',
      },
    ],
  },
  {
    id: 'presupuesto-gastos',
    order: 4,
    title: 'Presupuesto y Control de Gastos',
    mascot: 'ardilla',
    description:
      'El secreto de quienes nunca se atrasan: saben exactamente cuánto entra, cuánto sale y cuánto pueden comprometer.',
    thumbnail:
      'https://images.unsplash.com/photo-1554224154-22dec7ec8818?w=600&h=400&fit=crop',
    videoUrl: 'https://www.youtube.com/embed/PHe0bXAIuk0',
    videoDuration: '3:00',
    videoTitle: 'La Regla 50/30/20 adaptada a ingresos variables',
    bodyParagraphs: [
      'La diferencia entre las personas que pagan sus cuotas sin estrés y las que viven al límite no es cuánto ganan — es cuánto SABEN de su dinero. Un presupuesto no es una restricción, es una herramienta de libertad. Cuando sabes exactamente cuánto entra y cuánto sale, tomas decisiones desde la claridad, no desde la angustia.',
      'El método más simple y efectivo es la regla 50/30/20: divide tus ingresos mensuales en tres categorías. El 50% va para necesidades (comida, transporte, servicios, alquiler — lo que NO puedes dejar de pagar). El 30% para deseos (entretenimiento, comida fuera, compras personales — lo que disfrutas pero puedes reducir). Y el 20% para tu futuro (ahorro, pago de deudas, fondo de emergencia).',
      'Si eres independiente o tus ingresos varían cada mes (vendedor, comisionista, trabajador por cuenta propia), la regla se adapta así: toma el PEOR mes de los últimos tres como base para tu presupuesto. Todo lo que entre por encima de esa base va directamente al ahorro. Esto te protege de los meses malos sin cambiar tu estilo de vida.',
      'Para quienes manejan efectivo, el método de los SOBRES es increíblemente efectivo: el día que cobras, separas el dinero físicamente en sobres etiquetados (Comida, Transporte, Cuota FONDEA, Ahorro, Personal). Cuando se acaba el dinero de un sobre, se acabó — no se "pide prestado" de otro sobre. Este simple acto de separar físicamente el dinero reduce el gasto impulsivo entre un 20% y 30% según estudios de comportamiento financiero.',
    ],
    summaryPoints: [
      '50% para NECESIDADES: comida, transporte, servicios, alquiler. Lo que no puedes evitar.',
      '30% para DESEOS: entretenimiento, compras personales. Lo que puedes reducir si necesitas.',
      '20% para FUTURO: ahorro + pago de deudas. Tu cuota FONDEA sale de aquí.',
      'Ingresos variables: usa tu PEOR mes de los últimos 3 como base. Lo extra va al ahorro.',
      'Método de sobres: separa el dinero físicamente. Cuando se acaba un sobre, se acabó.',
    ],
    downloadUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    downloadLabel: 'Plantilla descargable: Control de gastos mensual (para rellenar)',
    externalLinks: [
      {
        institution: 'ASBANC',
        label: 'Hablemos Más Simple — Presupuesto familiar',
        url: 'https://www.hablemosmassimple.com.pe/',
      },
      {
        institution: 'UNAM / Coursera',
        label: 'Curso gratuito de Finanzas Personales',
        url: 'https://www.coursera.org/learn/finanzas-personales',
      },
      {
        institution: 'SBS Perú',
        label: 'App Presupuesto Familiar (descarga gratuita)',
        url: 'https://www.sbs.gob.pe/educacion-financiera',
      },
      {
        institution: 'Khan Academy',
        label: 'Personal Finance — Budgeting',
        url: 'https://es.khanacademy.org/college-careers-more/personal-finance',
      },
    ],
  },
  {
    id: 'ahorro-emergencia',
    order: 5,
    title: 'Ahorro y Fondo de Emergencia',
    mascot: 'ardilla',
    description:
      'No necesitas ganar mucho para ahorrar. Con S/ 10 a la semana puedes construir un colchón que te proteja de imprevistos sin recurrir a más deuda.',
    thumbnail:
      'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600&h=400&fit=crop',
    videoUrl: 'https://www.youtube.com/embed/PHe0bXAIuk0',
    videoDuration: '2:50',
    videoTitle: 'El reto de S/ 10 por semana que cambia vidas',
    bodyParagraphs: [
      'El 68% de los peruanos no tiene ahorros suficientes para cubrir un gasto inesperado de S/ 500. Eso significa que cualquier emergencia — una enfermedad, una reparación del hogar, quedarse sin trabajo una semana — se convierte automáticamente en deuda. El fondo de emergencia rompe ese ciclo.',
      'No necesitas empezar con mucho. El reto de S/ 10 por semana demuestra que el hábito importa más que la cantidad. S/ 10 parece insignificante, pero en 3 meses tienes S/ 120, en 6 meses S/ 240, y en un año S/ 520. Es el precio de un celular nuevo que probablemente no necesitabas. La clave es la consistencia, no la cantidad.',
      'La regla de oro del ahorro es simple pero poderosa: guárdalo en una cuenta SEPARADA que NO uses para gastos diarios. Si el dinero está en la misma cuenta donde recibes tu sueldo y pagas tus gastos, lo vas a gastar. Es psicología humana, no falta de voluntad. Puede ser una cuenta de ahorros distinta, una alcancía física, o incluso dinero en un sobre que dejas en casa de alguien de confianza.',
      '¿Para qué sirve concretamente? Para NO pedir un préstamo cuando se te rompe el celular y lo necesitas para trabajar. Para no atrasarte en tu cuota de FONDEA cuando tienes una semana mala de ventas. Para poder decir "esto lo pago sin endeudarme" frente a los imprevistos normales de la vida. Un fondo de emergencia no te hace rico — te hace libre de la urgencia.',
    ],
    summaryPoints: [
      'Meta ideal: 3 meses de gastos básicos. Si gastas S/ 1,200/mes, apunta a S/ 3,600. Pero empieza con lo que puedas.',
      'Reto S/ 10/semana: en 3 meses = S/ 120, en 6 meses = S/ 240, en 1 año = S/ 520.',
      'Regla de oro: cuenta SEPARADA. Si está con el resto de tu dinero, lo gastas. Punto.',
      'Automatiza: configura transferencia automática el día que cobras. Si no lo ves, no lo gastas.',
      'Sirve para NO pedir un préstamo por emergencias. Sin fondo, cualquier imprevisto = deuda nueva.',
    ],
    downloadUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    downloadLabel: 'Reto descargable: El ahorro semanal de S/ 10 (planilla de 12 semanas)',
    externalLinks: [
      {
        institution: 'BCP',
        label: 'Campus ABC del BCP — Módulo de Ahorro',
        url: 'https://www.viabcp.com/campus-abc',
      },
      {
        institution: 'BBVA Perú',
        label: 'Salud Financiera y Ahorro',
        url: 'https://www.bbva.pe/educacion-financiera.html',
      },
      {
        institution: 'Interbank',
        label: 'Aprende Más — Tips de ahorro práctico',
        url: 'https://interbank.pe/aprendemas',
      },
      {
        institution: 'FDIC (EE.UU.)',
        label: 'Money Smart Program — Savings Guide',
        url: 'https://www.fdic.gov/resources/consumers/money-smart/',
      },
    ],
  },
  {
    id: 'deuda-buena-mala',
    order: 6,
    title: 'Deuda Buena vs. Deuda Mala',
    mascot: 'buho',
    description:
      'No toda deuda es mala. La clave está en para qué la usas. Aprende a distinguir entre endeudarte para crecer vs. endeudarte para consumir.',
    thumbnail:
      'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&h=400&fit=crop',
    videoUrl: 'https://www.youtube.com/embed/PHe0bXAIuk0',
    videoDuration: '2:40',
    videoTitle: 'Usa el préstamo de FONDEA para crecer, no para gastar',
    bodyParagraphs: [
      'Existe un mito peligroso: "toda deuda es mala". La realidad es más matizada. Una deuda puede ser la mejor inversión de tu vida si la usas para generar más ingresos de los que te cuesta pagarla. El problema no es endeudarse — es endeudarse para lo incorrecto.',
      'La deuda BUENA es aquella que pones a trabajar: comprar mercadería que vas a revender con margen, adquirir herramientas que te permiten hacer más trabajos, invertir en un curso que sube tu valor profesional, o financiar inventario cuando tienes pedidos confirmados. El dinero prestado REGRESA multiplicado porque genera un retorno mayor que su costo.',
      'La deuda MALA es aquella que se consume y desaparece: comprar un celular más caro del que necesitas, ropa de marca para impresionar, salir de fiesta "porque te lo mereces", o peor aún — pagar una deuda con otra deuda (la famosa bola de nieve). El dinero prestado se EVAPORA y solo queda la obligación de pago sin nada a cambio.',
      'En FONDEA, el 78% de nuestros clientes que pagan puntualmente usan el préstamo para capital de trabajo de sus negocios. Antes de pedir un préstamo, hazte tres preguntas: ¿Lo NECESITO o solo lo quiero? ¿Me va a GENERAR dinero (directa o indirectamente)? ¿Puedo PAGAR la cuota sin que me genere estrés financiero? Si respondiste "no" a la segunda pregunta, piénsalo dos veces. Si respondiste "no" a la tercera, no lo hagas.',
    ],
    summaryPoints: [
      'DEUDA BUENA: Mercadería, herramientas, insumos, capacitación → genera retorno mayor que su costo.',
      'DEUDA MALA: Celular nuevo, ropa de marca, fiestas, pagar deuda con deuda → se consume sin retorno.',
      '3 preguntas antes de pedir: (1) ¿Lo necesito? (2) ¿Me genera dinero? (3) ¿Puedo pagar sin estrés?',
      'Si la respuesta a la pregunta 2 es "no", piénsalo. Si a la 3 es "no", NO lo hagas.',
      'El 78% de clientes FONDEA puntuales usan el préstamo para capital de trabajo. El crédito es una herramienta.',
    ],
    downloadUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    downloadLabel: 'Checklist imprimible: 3 preguntas antes de solicitar un préstamo',
    externalLinks: [
      {
        institution: 'SBS Perú',
        label: 'Finanzas Personales y Endeudamiento Responsable',
        url: 'https://www.sbs.gob.pe/educacion-financiera',
      },
      {
        institution: 'Fundación Romero',
        label: 'Campus Virtual Romero — Finanzas Básicas para emprendedores',
        url: 'https://www.campusromero.pe/',
      },
      {
        institution: 'Khan Academy',
        label: 'Tutorial interactivo de Interés y Deuda',
        url: 'https://es.khanacademy.org/economics-finance-domain/core-finance/interest-tutorial',
      },
      {
        institution: 'CFPB (EE.UU.)',
        label: 'Managing Debt — Consumer Resources',
        url: 'https://www.consumerfinance.gov/consumer-tools/debt/',
      },
    ],
  },
  {
    id: 'seguridad-digital',
    order: 7,
    title: 'Seguridad Digital',
    mascot: 'ardilla',
    description:
      'Protege tu dinero y tus datos. Aprende a identificar fraudes, phishing y estafas por WhatsApp antes de que sea demasiado tarde.',
    thumbnail:
      'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=600&h=400&fit=crop',
    videoUrl: 'https://www.youtube.com/embed/PHe0bXAIuk0',
    videoDuration: '2:55',
    videoTitle: 'Los 3 NUNCAS de la seguridad financiera digital',
    bodyParagraphs: [
      'Los fraudes financieros digitales en Perú crecieron 45% en el último año. Los estafadores se han vuelto increíblemente sofisticados: crean páginas web idénticas a las de tu banco, envían mensajes de WhatsApp que parecen oficiales, y hasta te llaman haciéndose pasar por "soporte técnico". Si no estás alerta, puedes perder todo tu dinero en minutos.',
      'Los fraudes más comunes en Perú funcionan así: recibes un SMS o WhatsApp que dice "Tu cuenta ha sido bloqueada, ingresa aquí para verificar". El link te lleva a una página que se ve IDÉNTICA a la de tu banco. Ingresas tu usuario y clave — y en ese momento, el estafador ya tiene acceso a tu cuenta real. Otra modalidad: te llaman diciendo ser del banco y te piden "confirmar" tu clave o código OTP por seguridad. Ningún banco ni FONDEA te pide eso JAMÁS.',
      'La regla de los 3 NUNCAS te protege del 95% de fraudes: NUNCA compartas tu clave, token o código de verificación con nadie (ni con "el banco", ni con "soporte técnico", ni con nadie que te llame o escriba). NUNCA abras links que te llegan por SMS, WhatsApp o email que piden datos personales. NUNCA pagues a cuentas personales — FONDEA solo cobra desde canales oficiales con nombre de empresa.',
      'Una capa adicional de protección que deberías activar HOY: la verificación en 2 pasos (2FA) en tu correo electrónico, WhatsApp y billeteras digitales (Yape, Plin). Esto significa que incluso si alguien obtiene tu contraseña, necesita un segundo código que solo tú tienes. Es tu última línea de defensa y toma menos de 5 minutos configurarlo. Y recuerda: si algo te parece sospechoso, NO actúes por urgencia. Los estafadores crean presión artificial ("tu cuenta será bloqueada en 1 hora"). Respira, cierra el mensaje, y contacta directamente al banco o a FONDEA por los canales oficiales.',
    ],
    summaryPoints: [
      'NUNCA compartas tu clave, token o código SMS con nadie. FONDEA JAMÁS te lo pedirá por teléfono o WhatsApp.',
      'NUNCA abras links de SMS/WhatsApp/email que piden datos. Los bancos y FONDEA no envían links para "verificar".',
      'NUNCA pagues a cuentas personales (Yape/Plin a nombre de persona). FONDEA solo cobra por canales oficiales.',
      'Activa verificación en 2 pasos (2FA) en correo, WhatsApp y billeteras digitales. Toma 5 minutos y te salva.',
      'Si algo parece sospechoso, NO actúes por urgencia. Los estafadores crean presión falsa. Respira y verifica.',
    ],
    downloadUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    downloadLabel: 'Infografía: Los 3 NUNCAS de la seguridad digital (para compartir)',
    externalLinks: [
      {
        institution: 'BCP',
        label: 'Centro de Seguridad y Prevención de Fraudes',
        url: 'https://www.viabcp.com/seguridad',
      },
      {
        institution: 'ASBANC',
        label: 'Módulo de Ciberseguridad Bancaria',
        url: 'https://www.hablemosmassimple.com.pe/seguridad',
      },
      {
        institution: 'SBS Perú',
        label: 'Prevención de Fraudes Financieros — Material educativo',
        url: 'https://www.sbs.gob.pe/educacion-financiera',
      },
      {
        institution: 'FTC (EE.UU.)',
        label: 'Scam Alerts & Fraud Prevention — Consumer Advice',
        url: 'https://consumer.ftc.gov/scams',
      },
    ],
  },
];
