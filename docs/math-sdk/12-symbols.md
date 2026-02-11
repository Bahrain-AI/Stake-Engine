# Symbols

> Source: https://stakeengine.github.io/math-sdk/math_docs/gamestate_section/syms_board_section/symbol_info/

## Symbol Structure

Symbols are implemented as distinct class objects. The Symbol class initializes with a config object and name string, automatically assigning attributes based on whether the symbol name appears in `config.paytable` or `config.special_symbols` fields.

## Core Symbol Attributes

- **Name** — A shorthand identifier (typically 1-2 letters)
- **special_functions** — Applied through the GameStateOverride class for immediate customization
- **is_special** — Boolean property, defaults to False
- **special_property** — Set to True if name appears in config.special_symbols
- **assign_paying_bool()** — Determines if symbol is paying and assigns paytable values

## Special Functions

Multiplier values can be assigned to wild symbols using `assign_special_sym_function()` and callable functions registered in `special_symbol_functions` dictionary.

## Symbol Attribute Methods

- **`check_attribute()`** — Returns boolean if attribute exists and isn't False
- **`get_attribute()`** — Retrieves attribute values
- **`assign_attribute()`** — Dynamically assigns properties to symbols

## Practical Use Case

Special symbols on the board can be identified and modified. For example, wild symbols can be enhanced with multiplier values based on the presence of enhance symbols.
