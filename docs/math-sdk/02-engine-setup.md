# Engine Setup

> Source: https://stakeengine.github.io/math-sdk/math_docs/general_overview/

## Setup and Installation Requirements

Running the math-sdk requires **Python3 and PIP** to be installed. Additionally, **Rust/Cargo** must also be installed for the optimization algorithm to run.

Clone the repository:
```bash
git clone git@github.com:StakeEngine/math-sdk.git
```

## Installation Methods

### Makefile Approach (Recommended)

The quickest setup uses Make and Python3:

```bash
make setup
```

This initializes a virtual environment and installs packages from `requirements.txt`.

After configuration, run games with:
```bash
make run GAME=<game_id>
```

### Cargo Installation

For optimization features, install Rust/Cargo:
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Manual Installation Steps

1. Create virtual environment:
   ```bash
   python3 -m venv env
   ```

2. Activate:
   - Mac: `source env/bin/activate`
   - Windows: `env\Scripts\activate.bat`

3. Install dependencies:
   ```bash
   python3 -m pip install -r requirements.txt
   ```

4. Install package:
   ```bash
   python3 -m pip install -e .
   ```

5. Verify with:
   ```bash
   python3 -m pip list
   ```

### Deactivation

Use the command `deactivate` to exit the virtual environment.
