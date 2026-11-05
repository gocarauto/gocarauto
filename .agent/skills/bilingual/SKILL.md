---
name: Bilingual Support
description: Guidelines and requirements for handling bilingual text in GoCar Auto.
---

# Bilingual Support Standards

GoCar Auto requires comprehensive bilingual support, particularly for service history item names and user-facing portal text.

## Standards
1. **Database Schema**: Ensure database tables that store user-facing descriptive content (like `service_items`) have columns for both English and Arabic (e.g., `name_en` and `name_ar`).
2. **Data Entry & Generation**: When writing scripts to seed the database or creating UI forms for staff to add new items, ALWAYS require or prompt for both English and Arabic strings.
3. **UI Rendering**: The Customer Portal and Staff Interface should be capable of displaying the appropriate language based on user preference or context, gracefully falling back to English if the Arabic translation is missing.
4. **Text Directionality**: When rendering Arabic text in the UI, ensure proper RTL (Right-to-Left) styling and alignment are applied. Refer to [rtl_safe_properties.json](file:///home/akhalil/AntiGravity/GoCar%20Auto/.agent/skills/bilingual/resources/rtl_safe_properties.json) for CSS guidance.

## Resources
- [RTL Safe CSS Properties](file:///home/akhalil/AntiGravity/GoCar%20Auto/.agent/skills/bilingual/resources/rtl_safe_properties.json)
