flowchart TD

%% =========================
%% SECCIÓN 1: LANDING PAGE
%% =========================
subgraph S1[1. Landing Page y Acceso]
A[Usuario llega a Landing Page] --> B[Interactúa con Calculadora]
B --> C[Solicita Préstamo]
C --> D[Redirección a Plataforma]

D --> E{¿Está logueado?}

E -- No --> F[Mostrar Registro]
F --> G[Ingresar Email / Celular / DNI / Contraseña]
F --> H[Opción Registro con Google / DNI / Celular]
G --> I[Validar Celular por OTP]
H --> I
I --> J[Cuenta Activa]
J --> L[Iniciar Sesión]

E -- Sí --> L
end

%% =========================
%% SECCIÓN 2: FORMULARIOS
%% =========================
subgraph S2[2. Formularios y Preaprobación]
L --> M{¿Cuenta nueva?}

M -- Sí --> N[Validar Datos Básicos DNI]
N --> O[Solicitar Nombres / Apellidos / Código Verificación DNI]

O --> P{¿Datos válidos?}
P -- No --> N
P -- Sí --> Q[Ingresar a Formularios]

M -- No --> Q

Q --> R[Completar Formularios:<br/>Laboral / Económico / Referencias / Dirección / Cuenta Bancaria]

R --> S[Llegar a Resumen]
S --> T[Botón Enviar a Revisión]
T --> U[Generar Solicitud]

U --> V{¿Solicitud Preaprobada?}

V -- No --> W[Solicitud no aprobada]
V -- Sí --> X{¿Identidad biométrica validada antes?}
end

%% =========================
%% SECCIÓN 3: APROBACIÓN
%% =========================
subgraph S3[3. Aprobación y Firma de Contrato]

X -- No --> Y[Solicitar Fotos DNI + Selfie]
Y --> AE[Mostrar Contrato]

X -- Sí --> AE

AE --> AF[Firma Contrato]
AF --> AG[Aprobación Final]
AG --> AH[Desembolso]

end