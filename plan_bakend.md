 📦 MÓDULO 1: business-validation

  Ubicación: src/main/java/pe/com/fondea/backend/businessvalidation/

  Estructura Hexagonal

  businessvalidation/
  ├── domain/
  │   ├── model/
  │   │   ├── ValidationResult.java
  │   │   ├── ValidationError.java
  │   │   ├── ValidationSeverity.java          // ERROR, WARNING, INFO
  │   │   ├── ValidationRule.java
  │   │   ├── ProfileSnapshot.java
  │   │   └── ValidationRecord.java            // ⭐ Registro de validación
  │   │
  │   ├── service/
  │   │   └── validator/
  │   │       ├── BusinessRuleValidator.java   // Interface
  │   │       ├── LaborIncomeValidator.java
  │   │       ├── ExpenseIncomeValidator.java
  │   │       ├── LoanAmountCapacityValidator.java
  │   │       ├── AgeEmploymentValidator.java
  │   │       └── ReferencesConsistencyValidator.java
  │   │
  │   └── exception/
  │       ├── BusinessValidationException.java
  │       └── ProfileIncompleteException.java
  │
  ├── application/
  │   ├── port/
  │   │   ├── in/
  │   │   │   └── ValidateBusinessRulesUseCase.java
  │   │   │
  │   │   └── out/
  │   │       ├── ProfileDataPort.java
  │   │       ├── ValidationRecordRepositoryPort.java
  │   │       └── LoanIntentionStatusPort.java  // ⭐ Para actualizar estado
  │   │
  │   ├── service/
  │   │   └── BusinessValidationService.java
  │   │
  │   └── dto/
  │       ├── request/
  │       │   └── ValidateProfileRequest.java
  │       │
  │       └── response/
  │           ├── ValidationResultResponse.java
  │           └── ValidationRecordResponse.java
  │
  └── infrastructure/
      ├── adapter/
      │   ├── in/web/
      │   │   └── BusinessValidationController.java  // Admin: consultar validaciones
      │   │
      │   └── out/
      │       ├── profile/
      │       │   └── ProfileDataAggregatorAdapter.java
      │       │
      │       ├── intention/
      │       │   └── LoanIntentionStatusAdapter.java
      │       │
      │       └── persistence/
      │           ├── entity/
      │           │   └── ValidationRecordJpaEntity.java
      │           │
      │           ├── mapper/
      │           │   └── ValidationRecordMapper.java
      │           │
      │           ├── jpa/
      │           │   └── ValidationRecordJpaRepository.java
      │           │
      │           └── repository/
      │               └── ValidationRecordRepositoryAdapter.java
      │
      └── config/
          └── BusinessValidationConfig.java

  Modelo de Datos: validation_records

  CREATE TABLE validation_records (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      loan_intention_id UUID NOT NULL,
      user_id UUID NOT NULL,

      -- Resultado
      is_valid BOOLEAN NOT NULL,
      validation_status VARCHAR(20) NOT NULL,     -- PASSED, FAILED

      -- Detalles
      errors JSONB,                               -- Array de errores encontrados
      warnings JSONB,                             -- Warnings (no bloquean)
      rules_executed JSONB NOT NULL,              -- Qué validadores se ejecutaron

      -- Auditoría
      validated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      execution_time_ms INTEGER,

      -- Índices
      INDEX idx_intention_validation (loan_intention_id),
      INDEX idx_user_validations (user_id, validated_at DESC),
      INDEX idx_validation_status (validation_status)
  );

  ---
  📦 MÓDULO 2: scoring (CRÍTICO)

  Ubicación: src/main/java/pe/com/fondea/backend/scoring/

  Estructura Hexagonal

  scoring/
  ├── domain/
  │   ├── model/
  │   │   ├── CreditScore.java                 // ⭐ Score del usuario (0-999)
  │   │   ├── ScoreStatus.java                 // VALID, EXPIRED, CALCULATED
  │   │   ├── ScoringResult.java               // Resultado completo del cálculo
  │   │   ├── ScoreBreakdown.java              // Desglose detallado
  │   │   ├── CategoryScore.java               // Score por categoría
  │   │   ├── ExternalScore.java               // Score de Experian
  │   │   ├── ScoringConfiguration.java        // ⭐ Configuración usada
  │   │   └── ScoringHistory.java              // ⭐ Historial completo
  │   │
  │   ├── service/
  │   │   ├── ScoringEngine.java               // Motor principal
  │   │   ├── WeightedScoreCalculator.java
  │   │   ├── CategoryScorer.java
  │   │   └── ScoreExpirationService.java      // Maneja vigencia
  │   │
  │   └── exception/
  │       ├── ScoringCalculationException.java
  │       ├── ExternalScoreUnavailableException.java
  │       └── InvalidScoringConfigurationException.java
  │
  ├── application/
  │   ├── port/
  │   │   ├── in/
  │   │   │   ├── CalculateScoreUseCase.java
  │   │   │   ├── RecalculateScoreUseCase.java      // Admin recalcular
  │   │   │   ├── GetScoreHistoryUseCase.java
  │   │   │   └── GetCurrentValidScoreUseCase.java  // Admin: ver vigente
  │   │   │
  │   │   └── out/
  │   │       ├── ProfileDataPort.java
  │   │       ├── ScoringConfigurationPort.java     // ⭐ Lee reglas activas
  │   │       ├── ExternalScoreProviderPort.java    // Experian API
  │   │       ├── ScoreRepositoryPort.java          // ⭐ CRUD de scores
  │   │       ├── ScoringHistoryRepositoryPort.java
  │   │       └── LoanIntentionStatusPort.java
  │   │
  │   ├── service/
  │   │   ├── InternalScoringService.java
  │   │   ├── ScoringHistoryService.java
  │   │   └── ScoreRecalculationService.java        // Admin
  │   │
  │   └── dto/
  │       ├── request/
  │       │   ├── CalculateScoreRequest.java
  │       │   └── RecalculateScoreRequest.java
  │       │
  │       └── response/
  │           ├── CreditScoreResponse.java
  │           ├── ScoringResultResponse.java
  │           ├── ScoreBreakdownResponse.java
  │           └── ScoringHistoryResponse.java
  │
  └── infrastructure/
      ├── adapter/
      │   ├── in/web/
      │   │   ├── ScoringController.java            // Admin: recalcular
      │   │   └── ScoringHistoryController.java     // Admin: ver historial
      │   │
      │   └── out/
      │       ├── configuration/
      │       │   └── JsonScoringConfigurationAdapter.java
      │       │
      │       ├── external/
      │       │   ├── ExperianScoreAdapter.java
      │       │   └── ExperianScoreMockAdapter.java
      │       │
      │       ├── profile/
      │       │   └── ProfileDataAggregatorAdapter.java
      │       │
      │       ├── intention/
      │       │   └── LoanIntentionStatusAdapter.java
      │       │
      │       └── persistence/
      │           ├── entity/
      │           │   ├── CreditScoreJpaEntity.java         // ⭐ Score del usuario
      │           │   ├── ScoringHistoryJpaEntity.java      // ⭐ Historial
      │           │   └── ScoringSnapshotJpaEntity.java     // ⭐ Datos completos
      │           │
      │           ├── mapper/
      │           │   ├── CreditScoreMapper.java
      │           │   └── ScoringHistoryMapper.java
      │           │
      │           ├── jpa/
      │           │   ├── CreditScoreJpaRepository.java
      │           │   ├── ScoringHistoryJpaRepository.java
      │           │   └── ScoringSnapshotJpaRepository.java
      │           │
      │           └── repository/
      │               ├── CreditScoreRepositoryAdapter.java
      │               └── ScoringHistoryRepositoryAdapter.java
      │
      └── config/
          └── ScoringConfig.java

  Modelo de Datos

  1. Tabla: credit_scores (Score actual del usuario)

  CREATE TABLE credit_scores (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id),

      -- Score
      score INTEGER NOT NULL CHECK (score >= 0 AND score <= 999),

      -- Vigencia
      calculated_at TIMESTAMP NOT NULL,
      valid_until TIMESTAMP,                      -- NULL = ilimitado
      is_valid BOOLEAN GENERATED ALWAYS AS (
          valid_until IS NULL OR valid_until > NOW()
      ) STORED,

      -- Vínculo opcional con solicitud
      loan_intention_id UUID REFERENCES loan_intentions(id),

      -- Metadata
      calculation_trigger VARCHAR(50) NOT NULL,   -- LOAN_APPLICATION, ADMIN_RECALC

      -- Auditoría
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),

      -- Índices
      UNIQUE INDEX idx_user_latest_score (user_id, calculated_at DESC),
      INDEX idx_user_valid_scores (user_id, is_valid),
      INDEX idx_intention_score (loan_intention_id)
  );

  2. Tabla: scoring_history (Historial completo)

  CREATE TABLE scoring_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      credit_score_id UUID NOT NULL REFERENCES credit_scores(id),
      user_id UUID NOT NULL,
      loan_intention_id UUID REFERENCES loan_intentions(id),

      -- Score final
      final_score INTEGER NOT NULL,

      -- Scores externos
      experian_score INTEGER,
      experian_request_id VARCHAR(100),
      experian_queried_at TIMESTAMP,

      -- Configuración usada (⭐ CRÍTICO)
      rules_version VARCHAR(50) NOT NULL,         -- ej: "v1.0.0"
      rules_snapshot JSONB NOT NULL,              -- JSON completo de las reglas usadas

      -- Breakdown detallado (⭐ CRÍTICO)
      score_breakdown JSONB NOT NULL,             -- Cómo se calculó cada categoría

      -- Metadata
      calculation_timestamp TIMESTAMP NOT NULL,
      execution_time_ms INTEGER,
      calculation_trigger VARCHAR(50),            -- LOAN_APPLICATION, ADMIN_RECALC
      calculated_by_user_id UUID,                 -- Si fue admin quien recalculó

      -- Auditoría
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),

      -- Índices
      INDEX idx_user_history (user_id, calculation_timestamp DESC),
      INDEX idx_credit_score_history (credit_score_id),
      INDEX idx_intention_history (loan_intention_id),
      INDEX idx_rules_version (rules_version)
  );

  3. Tabla: scoring_snapshots (Datos de entrada completos)

  CREATE TABLE scoring_snapshots (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      scoring_history_id UUID NOT NULL REFERENCES scoring_history(id),

      -- Snapshot completo de datos usados (⭐ CRÍTICO para auditoría)
      profile_data JSONB NOT NULL,                -- Todos los datos del perfil

      -- Auditoría
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),

      -- Índices
      INDEX idx_history_snapshot (scoring_history_id)
  );

  Ejemplo de rules_snapshot (JSONB):
  {
    "version": "v1.0.0",
    "name": "Scoring Model v1",
    "scoringConfig": {
      "minScore": 0,
      "maxScore": 999,
      "defaultValidityDays": 90
    },
    "categories": [
      {
        "code": "labor",
        "weight": 25,
        "rules": [
          {
            "id": "labor_001",
            "field": "employmentType",
            "weight": 40,
            "type": "exact_match",
            "scoring": {
              "DEPENDENT": 100,
              "INDEPENDENT": 85
            }
          }
        ]
      }
    ]
  }

  Ejemplo de score_breakdown (JSONB):
  {
    "finalScore": 745,
    "categories": [
      {
        "code": "labor",
        "weight": 25,
        "rawScore": 845,
        "contribution": 211.25,
        "fields": [
          {
            "ruleId": "labor_001",
            "field": "employmentType",
            "value": "DEPENDENT",
            "rawScore": 100,
            "fieldWeight": 40,
            "contribution": 40
          }
        ]
      }
    ],
    "externalScoreContribution": 187.5
  }

  Ejemplo de profile_data (JSONB):
  {
    "kyc": {
      "dni": "12345678",
      "firstName": "JUAN",
      "verificationStatus": "VERIFIED"
    },
    "labor": {
      "employmentType": "DEPENDENT",
      "monthlyIncome": 3500,
      "employmentDurationMonths": 18
    },
    "economic": {
      "monthlyExpenses": 1500,
      "hasOtherDebts": false
    }
  }

  ---
  📦 MÓDULO 3: solicitud/application (Ya existe - actualizamos)

  Ubicación: src/main/java/pe/com/fondea/backend/solicitud/application/

  Actualizar IntentionStatus (Estados)

  public enum IntentionStatus {
      // Estados iniciales
      DRAFT,                          // Borrador, no enviada
      SUBMITTED,                      // Enviada por el usuario

      // ⭐ Nuevos estados de procesamiento
      VALIDATING_BUSINESS_RULES,      // Validando reglas de negocio (Capa 1)
      BUSINESS_VALIDATION_FAILED,     // Falló validación de negocio

      CALCULATING_SCORE,              // Calculando score interno (Capa 2)
      SCORE_CALCULATION_FAILED,       // Falló cálculo de score
      SCORE_CALCULATED,               // Score calculado exitosamente

      // Estados futuros (Capa 3)
      EVALUATING,                     // Evaluando aprobación/rechazo
      APPROVED,                       // Aprobada
      REJECTED,                       // Rechazada
      MORE_INFO,                      // Requiere más información

      // Estados finales
      SIGNED,                         // Contrato firmado
      DISBURSING,                     // En proceso de desembolso
      COMPLETED                       // Completada
  }

  Actualizar LoanIntention (Dominio)

  public class LoanIntention {
      // ... campos existentes ...

      // ⭐ Nuevo: referencia al score calculado
      private UUID creditScoreId;

      // Métodos de transición de estado

      public LoanIntention startBusinessValidation() {
          return this.toBuilder()
              .status(IntentionStatus.VALIDATING_BUSINESS_RULES)
              .updatedAt(LocalDateTime.now())
              .build();
      }

      public LoanIntention failBusinessValidation(String reason) {
          return this.toBuilder()
              .status(IntentionStatus.BUSINESS_VALIDATION_FAILED)
              .rejectionReason(reason)
              .evaluatedAt(LocalDateTime.now())
              .updatedAt(LocalDateTime.now())
              .build();
      }

      public LoanIntention startScoreCalculation() {
          return this.toBuilder()
              .status(IntentionStatus.CALCULATING_SCORE)
              .updatedAt(LocalDateTime.now())
              .build();
      }

      public LoanIntention failScoreCalculation(String reason) {
          return this.toBuilder()
              .status(IntentionStatus.SCORE_CALCULATION_FAILED)
              .rejectionReason(reason)
              .evaluatedAt(LocalDateTime.now())
              .updatedAt(LocalDateTime.now())
              .build();
      }

      public LoanIntention completeScoreCalculation(UUID creditScoreId) {
          return this.toBuilder()
              .status(IntentionStatus.SCORE_CALCULATED)
              .creditScoreId(creditScoreId)
              .updatedAt(LocalDateTime.now())
              .build();
      }
  }

  ---
  🔄 FLUJO COMPLETO CON ESTADOS

  ┌─────────────────────────────────────────────────────────────┐
  │  Usuario: POST /api/applications/submit                     │
  └────────────────────┬────────────────────────────────────────┘
                       │
                       ▼
           LoanIntention: SUBMITTED
                       │
                       ▼
  ┌─────────────────────────────────────────────────────────────┐
  │  EvaluationOrchestrator.evaluate()                          │
  │  - Actualiza estado: VALIDATING_BUSINESS_RULES              │
  └────────────────────┬────────────────────────────────────────┘
                       │
                       ▼
  ┌─────────────────────────────────────────────────────────────┐
  │  CAPA 1: BusinessValidationService.validate()               │
  │  - Ejecuta validadores                                      │
  │  - Guarda ValidationRecord en BD                            │
  └────────┬────────────────────────────────┬───────────────────┘
           │ FAIL                           │ PASS
           ▼                                ▼
    ┌──────────────────┐         ┌────────────────────────────┐
    │ Estado:          │         │ Estado:                    │
    │ BUSINESS_        │         │ CALCULATING_SCORE          │
    │ VALIDATION_      │         └────────┬───────────────────┘
    │ FAILED           │                  │
    │                  │                  ▼
    │ TERMINA AQUÍ     │  ┌──────────────────────────────────┐
    └──────────────────┘  │ CAPA 2: InternalScoringService   │
                          │ - Obtiene Experian score         │
                          │ - Calcula score interno          │
                          │ - Guarda CreditScore             │
                          │ - Guarda ScoringHistory          │
                          │ - Guarda ScoringSnapshot         │
                          └────────┬───────────────┬─────────┘
                                   │ FAIL          │ SUCCESS
                                   ▼               ▼
                      ┌────────────────┐  ┌────────────────────┐
                      │ Estado:        │  │ Estado:            │
                      │ SCORE_         │  │ SCORE_CALCULATED   │
                      │ CALCULATION_   │  │                    │
                      │ FAILED         │  │ creditScoreId: XXX │
                      │                │  │                    │
                      │ TERMINA AQUÍ   │  │ ✅ LISTO          │
                      └────────────────┘  └────────────────────┘

  ---
  🔧 ORQUESTADOR PRINCIPAL

  Ubicación: src/main/java/pe/com/fondea/backend/solicitud/application/application/service/EvaluationO
  rchestrator.java

  @Service
  @RequiredArgsConstructor
  @Slf4j
  public class EvaluationOrchestrator {

      private final LoanIntentionRepositoryPort loanIntentionRepository;
      private final ValidateBusinessRulesUseCase businessValidationService;
      private final CalculateScoreUseCase scoringService;

      /**
       * Orquesta todo el proceso de evaluación.
       * Por ahora es síncrono, en el futuro será async con colas.
       */
      public void evaluate(UUID intentionId) {
          log.info("Starting evaluation for intention: {}", intentionId);

          try {
              // Cargar solicitud
              var intention = loanIntentionRepository.findById(intentionId)
                  .orElseThrow(() -> new NotFoundException("Intention not found"));

              // ===== CAPA 1: VALIDACIÓN DE NEGOCIO =====
              intention = intention.startBusinessValidation();
              loanIntentionRepository.save(intention);

              var validationResult = businessValidationService.validate(
                  ValidateProfileRequest.builder()
                      .userId(intention.getUserId())
                      .loanIntentionId(intentionId)
                      .build()
              );

              if (!validationResult.isValid()) {
                  log.warn("Business validation failed for intention {}: {}",
                      intentionId, validationResult.getErrors());

                  intention = intention.failBusinessValidation(
                      validationResult.getErrors().get(0).getMessage()
                  );
                  loanIntentionRepository.save(intention);
                  return; // TERMINA AQUÍ
              }

              log.info("Business validation passed for intention: {}", intentionId);

              // ===== CAPA 2: CÁLCULO DE SCORE =====
              intention = intention.startScoreCalculation();
              loanIntentionRepository.save(intention);

              var scoringResult = scoringService.calculate(
                  CalculateScoreRequest.builder()
                      .userId(intention.getUserId())
                      .loanIntentionId(intentionId)
                      .trigger(CalculationTrigger.LOAN_APPLICATION)
                      .build()
              );

              log.info("Score calculated successfully for intention {}: score={}",
                  intentionId, scoringResult.getScore());

              intention = intention.completeScoreCalculation(scoringResult.getCreditScoreId());       
              loanIntentionRepository.save(intention);

              log.info("Evaluation completed successfully for intention: {}", intentionId);

          } catch (Exception e) {
              log.error("Error during evaluation of intention {}: {}", intentionId, e.getMessage(),   
  e);

              var intention = loanIntentionRepository.findById(intentionId).orElseThrow();
              intention = intention.failScoreCalculation("Error interno: " + e.getMessage());
              loanIntentionRepository.save(intention);
          }
      }
  }

  ---
  📋 CONFIGURACIÓN DE SCORING (JSON)

  Ubicación: src/main/resources/scoring/scoring-config-v1.json

  {
    "version": "v1.0.0",
    "name": "Fondea Scoring Model v1",
    "description": "Modelo de scoring inicial para préstamos personales en Perú",
    "active": true,
    "createdAt": "2026-05-11T10:00:00Z",
    "publishedAt": "2026-05-11T12:00:00Z",

    "scoringConfig": {
      "minScore": 0,
      "maxScore": 999,
      "defaultValidityDays": 90
    },

    "categories": [
      {
        "code": "kyc",
        "label": "Verificación de Identidad",
        "weight": 5,
        "enabled": true,
        "rules": [
          {
            "id": "kyc_001",
            "field": "verificationStatus",
            "label": "Estado de Verificación",
            "weight": 100,
            "type": "exact_match",
            "scoring": {
              "VERIFIED": 100,
              "UNVERIFIED": 0,
              "BLOCKED": 0
            }
          }
        ]
      },

      {
        "code": "labor",
        "label": "Información Laboral",
        "weight": 25,
        "enabled": true,
        "rules": [
          {
            "id": "labor_001",
            "field": "employmentType",
            "weight": 40,
            "type": "exact_match",
            "scoring": {
              "DEPENDENT": 100,
              "INDEPENDENT": 85,
              "FREELANCE": 60,
              "UNEMPLOYED": 0,
              "RETIRED": 70
            }
          },
          {
            "id": "labor_002",
            "field": "monthlyIncome",
            "weight": 35,
            "type": "range",
            "scoring": [
              {"min": 0, "max": 1025, "score": 0},
              {"min": 1026, "max": 2500, "score": 40},
              {"min": 2501, "max": 4000, "score": 70},
              {"min": 4001, "max": 6000, "score": 85},
              {"min": 6001, "max": null, "score": 100}
            ]
          },
          {
            "id": "labor_003",
            "field": "employmentDurationMonths",
            "weight": 25,
            "type": "range",
            "scoring": [
              {"min": 0, "max": 3, "score": 20},
              {"min": 4, "max": 6, "score": 40},
              {"min": 7, "max": 12, "score": 60},
              {"min": 13, "max": 24, "score": 80},
              {"min": 25, "max": null, "score": 100}
            ]
          }
        ]
      },

      {
        "code": "economic",
        "label": "Situación Económica",
        "weight": 20,
        "enabled": true,
        "rules": [
          {
            "id": "economic_001",
            "field": "debtToIncomeRatio",
            "weight": 40,
            "type": "calculated_ratio",
            "numeratorField": "monthlyExpenses",
            "denominatorField": "monthlyIncome",
            "scoring": [
              {"min": 0, "max": 0.3, "score": 100},
              {"min": 0.31, "max": 0.5, "score": 80},
              {"min": 0.51, "max": 0.7, "score": 50},
              {"min": 0.71, "max": 1.0, "score": 20},
              {"min": 1.01, "max": null, "score": 0}
            ]
          },
          {
            "id": "economic_002",
            "field": "hasOtherDebts",
            "weight": 30,
            "type": "exact_match",
            "scoring": {
              "true": 40,
              "false": 100
            }
          },
          {
            "id": "economic_003",
            "field": "savingsAmount",
            "weight": 30,
            "type": "range",
            "scoring": [
              {"min": 0, "max": 0, "score": 50},
              {"min": 1, "max": 2000, "score": 70},
              {"min": 2001, "max": 5000, "score": 85},
              {"min": 5001, "max": null, "score": 100}
            ]
          }
        ]
      },

      {
        "code": "references",
        "label": "Referencias",
        "weight": 10,
        "enabled": true,
        "rules": [
          {
            "id": "ref_001",
            "field": "familyReferencesCount",
            "weight": 50,
            "type": "threshold",
            "scoring": [
              {"value": 0, "score": 0},
              {"value": 1, "score": 60},
              {"value": 2, "score": 100}
            ]
          },
          {
            "id": "ref_002",
            "field": "nonFamilyReferencesCount",
            "weight": 50,
            "type": "threshold",
            "scoring": [
              {"value": 0, "score": 0},
              {"value": 1, "score": 60},
              {"value": 2, "score": 100}
            ]
          }
        ]
      },

      {
        "code": "address",
        "label": "Domicilio",
        "weight": 5,
        "enabled": true,
        "rules": [
          {
            "id": "addr_001",
            "field": "residenceDurationMonths",
            "weight": 60,
            "type": "range",
            "scoring": [
              {"min": 0, "max": 6, "score": 40},
              {"min": 7, "max": 12, "score": 60},
              {"min": 13, "max": 24, "score": 80},
              {"min": 25, "max": null, "score": 100}
            ]
          },
          {
            "id": "addr_002",
            "field": "housingType",
            "weight": 40,
            "type": "exact_match",
            "scoring": {
              "OWNED": 100,
              "MORTGAGED": 90,
              "RENTED": 70,
              "FAMILY": 80,
              "OTHER": 50
            }
          }
        ]
      },

      {
        "code": "bankaccount",
        "label": "Cuenta Bancaria",
        "weight": 10,
        "enabled": true,
        "rules": [
          {
            "id": "bank_001",
            "field": "accountValidationStatus",
            "weight": 70,
            "type": "exact_match",
            "scoring": {
              "VERIFIED": 100,
              "PENDING": 50,
              "FAILED": 0
            }
          },
          {
            "id": "bank_002",
            "field": "accountType",
            "weight": 30,
            "type": "exact_match",
            "scoring": {
              "SAVINGS": 100,
              "CHECKING": 100,
              "CCI": 100,
              "OTHER": 70
            }
          }
        ]
      },

      {
        "code": "external_score",
        "label": "Score Externo (Experian)",
        "weight": 25,
        "enabled": true,
        "rules": [
          {
            "id": "ext_001",
            "field": "experianScore",
            "weight": 100,
            "type": "range",
            "scoring": [
              {"min": 0, "max": 549, "score": 0},
              {"min": 550, "max": 649, "score": 40},
              {"min": 650, "max": 749, "score": 70},
              {"min": 750, "max": 849, "score": 90},
              {"min": 850, "max": 999, "score": 100}
            ]
          }
        ]
      }
    ]
  }

  ---
  🎯 RESUMEN PARA DELEGAR TAREAS

  TAREA 1: Crear módulo business-validation

  - Estructura hexagonal completa
  - Implementar validadores:
    - LaborIncomeValidator
    - ExpenseIncomeValidator
    - LoanAmountCapacityValidator
    - AgeEmploymentValidator
    - ReferencesConsistencyValidator
  - Tabla validation_records
  - Service que orquesta todos los validadores
  - Guardar resultado en BD
  - Puerto para actualizar estado de LoanIntention

  TAREA 2: Crear módulo scoring

  - Estructura hexagonal completa
  - Modelo de dominio:
    - CreditScore
    - ScoringResult
    - ScoreBreakdown
    - ScoringHistory
  - Tablas:
    - credit_scores
    - scoring_history
    - scoring_snapshots
  - ScoringEngine que calcula score según JSON config
  - Adapter para Experian (mock + real)
  - Servicio de recálculo para admin
  - Endpoints admin:
    - POST /api/admin/scoring/recalculate
    - GET /api/admin/scoring/history/{userId}

  TAREA 3: Actualizar módulo solicitud/application

  - Añadir nuevos estados a IntentionStatus
  - Añadir creditScoreId a LoanIntention
  - Añadir métodos de transición de estado
  - Actualizar tabla loan_intentions (nueva columna credit_score_id)

  TAREA 4: Crear EvaluationOrchestrator

  - Service que orquesta todo el flujo
  - Por ahora síncrono
  - Llama a Capa 1 → Capa 2
  - Actualiza estado de LoanIntention en cada paso
  - Manejo de errores

  TAREA 5: Configuración de Scoring

  - Crear JSON de configuración
  - Adapter para leerlo
  - Validador de configuración (pesos suman 100%)

  ---