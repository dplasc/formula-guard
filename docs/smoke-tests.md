# FormulaGuard - Manual Smoke Test Checklist

This document provides a concise checklist for manual testing of core features before release.

## Product Type Toggle

1. **Product Type affects Max Usage (Group) warnings**
   - Create a formula with ingredients that have different Leave-On vs Rinse-Off limits
   - Set Product Type to "Leave-On"
   - Note the Max Usage (Group) warning limit displayed
   - Switch Product Type to "Rinse-Off"
   - **Expected:** Max Usage (Group) warning limit changes to reflect Rinse-Off limits

## Max Usage (Group) Warnings

2. **Category totals compare against MIN limit**
   - Add multiple ingredients from the same category (e.g., "Lipid")
   - Ensure ingredients have different max usage limits (e.g., 10%, 15%, 20%)
   - Set total percentage in that category to exceed the lowest limit
   - **Expected:** Warning shows total percentage vs the minimum (strictest) limit in the group

3. **Group with no limits shows no warning**
   - Add ingredients from a category where no ingredients have max usage limits defined
   - **Expected:** No Max Usage (Group) warning appears for that category

## Custom Ingredients

4. **Max Usage fallback works**
   - Create a custom ingredient with only "Max Usage (%)" field set (no Leave-On/Rinse-Off limits)
   - Add the ingredient to a formula
   - **Expected:** Max Usage display shows the fallback value (e.g., "Max Usage: 10% (fallback)")

5. **Advanced Leave-On/Rinse-Off fields persist**
   - Create a custom ingredient
   - Expand "Advanced (Leave-On / Rinse-Off)" section
   - Enter values for "Max Usage – Leave-On (%)" and "Max Usage – Rinse-Off (%)"
   - Save the ingredient
   - Edit the same ingredient
   - **Expected:** Advanced limit values are pre-populated and saved correctly

6. **Advanced limits affect display**
   - Create a custom ingredient with Leave-On: 5%, Rinse-Off: 10%, fallback Max Usage: 15%
   - Add ingredient to formula
   - Switch Product Type between Leave-On and Rinse-Off
   - **Expected:** Max Usage display updates to show appropriate limit based on Product Type

## EU Compliance

7. **Annex II shows as Prohibited with strong style**
   - Add an ingredient that triggers Annex II (prohibited) compliance block
   - **Expected:** Block displays with "EU Prohibited" badge, red styling, and ring-2 border

8. **Annex III/VI show as Restriction**
   - Add an ingredient that triggers Annex III or VI compliance block
   - **Expected:** Block displays with "EU Restriction" badge and orange/amber styling

9. **Disclaimer is visible**
   - Navigate to EU Compliance section
   - **Expected:** Informational disclaimer box is visible above compliance blocks, stating checks are informational and based on Annex II/III/VI

## IFRA Guidance

10. **IFRA guidance is visible**
    - Add an ingredient that has IFRA standards associated
    - Ensure the ingredient is marked as a Fragrance component
    - **Expected:** IFRA Guidance section appears with informational warnings

11. **IFRA warnings only for Fragrance ingredients**
    - Add an ingredient with IFRA data but NOT marked as Fragrance
    - **Expected:** No IFRA warning appears
    - Mark the same ingredient as Fragrance component
    - **Expected:** IFRA warning now appears

## Export Summary

12. **Modal opens**
    - Click "Compliance Summary" button
    - **Expected:** Modal opens with formula summary content

13. **Copy to Clipboard works**
    - Open Compliance Summary modal
    - Click "Copy to Clipboard" button
    - Paste into a text editor
    - **Expected:** Plain-text summary is copied with all formula details and warnings

14. **TXT download works**
    - Open Compliance Summary modal
    - Click "Download TXT" button
    - **Expected:** Text file downloads with filename format: `formula-summary-{name}-{YYYY-MM-DD}.txt`

15. **JSON download works**
    - Open Compliance Summary modal
    - Click "Download JSON" button
    - **Expected:** JSON file downloads with filename format: `formula-summary-{name}-{YYYY-MM-DD}.json`, containing structured data with meta, ingredients, and warnings

16. **Filenames include date**
    - Download both TXT and JSON files
    - **Expected:** Both filenames include current date in YYYY-MM-DD format

## Help Modal

17. **Help modal opens**
    - Click "How this works" link/button near warnings section
    - **Expected:** Modal opens with help content

18. **Help content shows bullet list**
    - Verify help modal content
    - **Expected:** Content is formatted as concise bullet points covering:
      - Product Type
      - Max Usage (Group) warnings
      - Max Usage limits
      - Custom ingredients
      - EU compliance checks
      - IFRA guidance
      - Compliance Summary export



