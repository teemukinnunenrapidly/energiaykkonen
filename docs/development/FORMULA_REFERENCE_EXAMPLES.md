# Formula Reference System Examples

The new `[formula:name]` reference system allows you to use results from existing formulas inside new formulas.

## Basic Example

If you have a formula named "Öljyn menekki vuodessa" that calculates:

```
[field:neliot] * [field:korkeus] * [field:henkilomaara] / 10
```

You can now create a new formula that references this result:

```
[formula:Öljyn menekki vuodessa] * [field:energy_price]
```

## Complex Example

Create a formula chain:

1. **Base Calculation**: "Energy Consumption"

   ```
   [field:square_meters] * [field:ceiling_height] * 0.8
   ```

2. **Intermediate Calculation**: "Energy Cost"

   ```
   [formula:Energy Consumption] * [field:energy_price]
   ```

3. **Final Calculation**: "Total Savings"
   ```
   [field:current_cost] - [formula:Energy Cost]
   ```

## Features

- ✅ **Automatic Dependency Resolution**: Formulas are calculated in the correct order
- ✅ **Circular Dependency Detection**: Prevents infinite loops
- ✅ **Caching**: Each formula is calculated only once per execution context
- ✅ **Deep Nesting**: Supports up to 10 levels of formula dependencies
- ✅ **Field + Formula Mix**: You can use both `[field:xxx]` and `[formula:xxx]` in the same formula

## Execution Order

1. The system detects all `[formula:xxx]` references
2. It recursively resolves dependencies (deepest first)
3. Each formula is executed and cached
4. The result replaces the `[formula:xxx]` reference
5. Finally, any `[field:xxx]` references are resolved
6. The final mathematical expression is evaluated

## Error Handling

- Missing formula references show clear error messages
- Circular dependencies are detected and reported
- Invalid formula results are caught and reported
- Maximum recursion depth prevents infinite loops
