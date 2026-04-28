---
name: Loan Funnel Forms
colors:
  primary: "#0F172A"
  primary-foreground: "#F8FAFC"
  secondary: "#64748B"
  muted: "#F1F5F9"
  muted-foreground: "#64748B"
  border: "#E2E8F0"
  input: "#FFFFFF"
  background: "#FFFFFF"
  foreground: "#0F172A"
  card: "#FFFFFF"
  card-foreground: "#0F172A"
  destructive: "#EF4444"
  destructive-foreground: "#FEFEFE"
  success: "#22C55E"
  warning: "#F59E0B"
typography:
  display-lg:
    fontFamily: "Inter"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  heading-md:
    fontFamily: "Inter"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.4
  body-md:
    fontFamily: "Inter"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: "Inter"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.4
  label-sm:
    fontFamily: "Inter"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
  caption:
    fontFamily: "Inter"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.3
rounded:
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.75rem"
  full: "9999px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
  2xl: "2.5rem"
  3xl: "3rem"
  section: "2.5rem"
components:
  form-header:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    typography: "{typography.display-lg}"
    iconSize: "2.5rem"
    iconBackgroundColor: "{colors.primary}"
    iconTextColor: "{colors.primary-foreground}"
    gradientHeight: "0.25rem"
    spacing: "{spacing.lg}"
  section-header:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    typography: "{typography.heading-md}"
    descriptionColor: "{colors.muted-foreground}"
    descriptionTypography: "{typography.body-sm}"
    spacing: "{spacing.xs}"
  form-field:
    backgroundColor: "{colors.input}"
    textColor: "{colors.foreground}"
    borderColor: "{colors.border}"
    borderWidth: "1px"
    borderRadius: "{rounded.md}"
    padding: "{spacing.md}"
    height: "2.5rem"
    typography: "{typography.body-md}"
    focusBorderColor: "{colors.primary}"
    errorBorderColor: "{colors.destructive}"
  form-field-focus:
    borderColor: "{colors.primary}"
    boxShadow: "0 0 0 2px rgba(15, 23, 42, 0.1)"
  form-field-error:
    borderColor: "{colors.destructive}"
    boxShadow: "0 0 0 2px rgba(239, 68, 68, 0.1)"
  form-label:
    textColor: "{colors.foreground}"
    typography: "{typography.label-sm}"
    marginBottom: "{spacing.xs}"
  form-description:
    textColor: "{colors.muted-foreground}"
    typography: "{typography.body-sm}"
    marginTop: "{spacing.xs}"
  form-error:
    textColor: "{colors.destructive}"
    typography: "{typography.body-sm}"
    marginTop: "{spacing.xs}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    borderRadius: "{rounded.md}"
    padding: "{spacing.md} {spacing.lg}"
    typography: "{typography.label-sm}"
    height: "2.5rem"
    minWidth: "4rem"
  button-primary-hover:
    backgroundColor: "rgba(15, 23, 42, 0.9)"
  button-primary-loading:
    backgroundColor: "rgba(15, 23, 42, 0.7)"
    cursor: "not-allowed"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    borderColor: "{colors.border}"
    borderWidth: "1px"
    borderRadius: "{rounded.md}"
    padding: "{spacing.md} {spacing.lg}"
    typography: "{typography.label-sm}"
    height: "2.5rem"
  button-secondary-hover:
    backgroundColor: "{colors.muted}"
  native-select:
    backgroundColor: "{colors.input}"
    textColor: "{colors.foreground}"
    borderColor: "{colors.border}"
    borderWidth: "1px"
    borderRadius: "{rounded.md}"
    padding: "{spacing.md}"
    height: "2.5rem"
    typography: "{typography.body-md}"
  switch:
    backgroundColor: "{colors.muted}"
    thumbColor: "{colors.background}"
    checkedBackgroundColor: "{colors.primary}"
    width: "2.75rem"
    height: "1.5rem"
    thumbSize: "1.25rem"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    borderColor: "{colors.border}"
    borderWidth: "1px"
    borderRadius: "{rounded.lg}"
    padding: "{spacing.xl}"
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)"
  separator:
    backgroundColor: "rgba(15, 23, 42, 0.2)"
    height: "1px"
    margin: "{spacing.section} 0"
  sticky-bottom-bar:
    backgroundColor: "{colors.card}"
    borderColor: "{colors.border}"
    borderTopWidth: "1px"
    padding: "{spacing.md} {spacing.xl}"
    zIndex: 30
  currency-input:
    prefixColor: "{colors.muted-foreground}"
    prefixTypography: "{typography.label-sm}"
    prefixPadding: "{spacing.md}"
  dynamic-field-container:
    backgroundColor: "transparent"
    borderColor: "{colors.border}"
    borderWidth: "1px"
    borderRadius: "{rounded.lg}"
    padding: "{spacing.lg}"
    spacing: "{spacing.lg}"
  choice-button:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    borderColor: "{colors.border}"
    borderWidth: "2px"
    borderRadius: "{rounded.lg}"
    padding: "{spacing.lg}"
    iconColor: "{colors.primary}"
    iconSize: "1.25rem"
  choice-button-selected:
    borderColor: "{colors.primary}"
    backgroundColor: "rgba(15, 23, 42, 0.05)"
  choice-button-hover:
    borderColor: "rgba(15, 23, 42, 0.5)"
---

# Loan Funnel Forms Design System

## Overview

Professional financial forms with emphasis on trust, clarity, and accessibility. The design language balances modern minimalism with the gravitas expected in financial applications. Clean typography, generous spacing, and subtle visual hierarchy guide users through complex multi-step processes without overwhelming them.

The system prioritizes form usability above all else - clear labels, helpful descriptions, immediate validation feedback, and logical information architecture. Every interaction reinforces confidence in the loan application process.

## Colors

The palette is built on high-contrast neutrals with a single primary accent, optimized for accessibility and professional credibility.

- **Primary (#0F172A):** Deep slate for primary actions, headers, and key interactive elements. Conveys trust and authority.
- **Secondary (#64748B):** Mid-tone gray for supporting text, borders, and secondary information. Maintains hierarchy without competing.
- **Muted (#F1F5F9):** Light background tint for subtle containers and disabled states. Provides visual rest areas.
- **Border (#E2E8F0):** Consistent stroke color for form fields, cards, and separators. Light enough to define without dominating.
- **Destructive (#EF4444):** Error red for validation messages and destructive actions. High contrast for immediate attention.
- **Success (#22C55E):** Confirmation green for success states and positive feedback.

All color combinations meet WCAG AA contrast requirements (4.5:1 minimum).

## Typography

Single font family (Inter) with carefully chosen weights and sizes for form-specific hierarchy.

- **Display Large:** Page titles and form headers. Bold weight creates strong entry points.
- **Heading Medium:** Section titles within forms. Semibold weight maintains hierarchy without overwhelming.
- **Body Medium:** Default text for form fields, descriptions, and general content. Regular weight for comfortable reading.
- **Body Small:** Helper text, captions, and secondary information. Smaller but still readable.
- **Label Small:** Form field labels and button text. Medium weight for clarity and scannability.
- **Caption:** Metadata, timestamps, and fine print. Smallest size while maintaining legibility.

Line heights are optimized for form density - tight enough for compact layouts, loose enough for comfortable reading.

## Layout

Forms use a consistent 3-column grid system:
- **Column 1:** Section headers with titles and descriptions
- **Columns 2-3:** Form fields and interactive elements

This creates natural reading flow and visual separation between context (what) and action (how).

**Spacing System:**
- **Section spacing (2.5rem):** Between major form sections
- **Field spacing (1.5rem):** Between individual form fields
- **Component spacing (1rem):** Internal component padding
- **Micro spacing (0.5rem):** Between labels and fields, descriptions and inputs

**Responsive Behavior:**
- Desktop: Full 3-column layout with generous spacing
- Tablet: Stacked layout with maintained spacing ratios
- Mobile: Single column with compressed but readable spacing

## Components

### Form Structure Components

**FormHeader:** Page-level introduction with icon, title, description, and visual progress indicator. The gradient bar reinforces forward momentum through the funnel.

**SectionHeader:** Introduces each form section with clear title and explanatory description. Consistent styling creates predictable information architecture.

**Separator:** Visual breaks between form sections using subtle horizontal rules. Provides breathing room without harsh divisions.

### Form Field Components

**FormField:** Base input styling with consistent height (2.5rem), padding, and border treatment. Focus states use primary color with subtle shadow for clear interaction feedback.

**FormLabel:** Semibold labels positioned above fields for clear association. Consistent sizing and spacing creates scannable form structure.

**FormDescription:** Helper text below fields in muted color. Provides context without competing with primary content.

**FormError:** Validation messages in destructive red with consistent positioning. Immediate feedback helps users correct issues quickly.

**NativeSelect:** Styled select dropdowns matching text input appearance. Maintains visual consistency across form field types.

**Switch:** Toggle controls for boolean choices. Clean styling with clear on/off states using primary color.

### Specialized Input Components

**CurrencyInput:** Text inputs with "S/" prefix for monetary values. Prefix styling matches field aesthetics while clearly indicating currency context.

**DynamicFieldContainer:** Bordered containers for repeating field groups (debts, additional income). Visual grouping helps users understand related information.

**ChoiceButton:** Large touch targets for either/or selections (Google vs Manual address entry). Icon + text + description format provides clear options with visual hierarchy.

### Action Components

**Button Primary:** High-emphasis actions in primary color. Loading states prevent double-submission while maintaining visual feedback.

**Button Secondary:** Lower-emphasis actions with outline styling. Provides clear secondary options without competing with primary actions.

**StickyBottomBar:** Fixed bottom container for dashboard mode. Includes autosave indicator and primary action, keeping key controls accessible during long forms.

### Container Components

**Card:** Elevated containers for form content with subtle shadow and border. Creates focused interaction areas without harsh boundaries.

## Interaction States

All interactive components include hover, focus, active, and disabled states:

- **Hover:** Subtle background or border color shifts
- **Focus:** Primary color borders with soft shadows for keyboard navigation
- **Active:** Slightly darker variations of base colors
- **Disabled:** Reduced opacity with cursor changes
- **Loading:** Spinner indicators with reduced opacity to prevent interaction

## Do's and Don'ts

### Do's
- Use consistent 2.5rem spacing between form sections
- Always include FormDescription for complex or sensitive fields
- Maintain 4.5:1 contrast ratio minimum for all text
- Use SectionHeader pattern for every major form section
- Include loading states for all async actions
- Provide immediate validation feedback with FormError
- Use Switch components for boolean choices rather than radio buttons
- Group related fields in DynamicFieldContainer when appropriate
- Include currency prefix (S/) for all monetary inputs
- Use ChoiceButton pattern for either/or selections with explanatory text

### Don'ts
- Never use more than one primary button per form section
- Don't stack multiple primary actions vertically
- Never omit FormLabel - all fields must be clearly labeled
- Don't use placeholder text as the only field identifier
- Never use pure black (#000000) or pure white (#FFFFFF) for text
- Don't create custom form field heights - stick to 2.5rem standard
- Never use red for anything other than errors or destructive actions
- Don't nest cards within cards - use flat hierarchy
- Never use disabled buttons without clear explanation of why they're disabled
- Don't use custom fonts - Inter handles all typography needs

## Accessibility

- All form fields include proper labels and descriptions
- Color is never the only indicator of state or meaning
- Focus indicators meet WCAG visibility requirements
- Touch targets are minimum 44px for mobile interaction
- Error messages are announced to screen readers
- Form progression is clearly indicated and navigable
- All interactive elements are keyboard accessible

## Technical Implementation

Forms use React Hook Form with Zod validation schemas. The component architecture separates:
- **Form logic:** useForm hooks with zodResolver
- **Validation:** Centralized Zod schemas with superRefine for complex rules
- **UI components:** Reusable form field components with consistent styling
- **Data flow:** Server actions for form submission with loading states

This separation ensures consistent behavior across all funnel forms while maintaining flexibility for form-specific requirements.