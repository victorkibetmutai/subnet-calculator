# Subnet Calculator

A fast, clean IPv4 subnet calculator that runs entirely in your browser. Enter an IP address with a CIDR prefix and instantly see the network details, binary breakdown, address formats, and subnet splits. No installs, no backend, no dependencies.

**[Live demo](https://victorkibetmutai.github.io/subnet-calculator/)**


## Features

- **Network details:** network address, broadcast address, first and last usable host, subnet mask, wildcard mask, total addresses, usable hosts, and prefix length
- **IP type badge:** quickly see whether an address is private, public, loopback, or link-local
- **Binary view:** the IP, network, and mask in binary, with network bits and host bits color-coded so the boundary is easy to see
- **Address formats:** hexadecimal and integer values for the input IP, network, and broadcast address
- **Contains check:** test whether a given IP address falls inside the network
- **Subnet splitter:** divide a network into equal subnets and view each one's CIDR, network, first and last usable address, broadcast, and host count
- **Export:** copy the split table or download it as CSV
- **Copy buttons:** copy any single value with one click
- **Dark and light themes**
- **Input validation:** clear error messages for invalid addresses or prefixes

## Edge cases handled

| Prefix | Behavior |
|---|---|
| `/31` | Treated as a point-to-point link per [RFC 3021](https://datatracker.ietf.org/doc/html/rfc3021): 2 usable addresses, no separate network or broadcast |
| `/32` | Single host: 1 address, with network, broadcast, first and last usable all identical |
| `/0` | Whole IPv4 space (4,294,967,296 addresses), using unsigned 32-bit math to avoid JavaScript's signed integer overflow |

## Usage

1. Type an address in CIDR notation, such as `192.168.10.37/26`.
2. Read the results instantly: network `192.168.10.0`, broadcast `192.168.10.63`, usable range `192.168.10.1` to `192.168.10.62`, 62 usable hosts.
3. Use **Contains check** to test whether another IP belongs to the network.
4. Use the **Subnet splitter** to break the network into smaller subnets, then copy or export the result.

### Example

| Input | `192.168.10.37/26` |
|---|---|
| Network address | `192.168.10.0` |
| Broadcast address | `192.168.10.63` |
| Subnet mask | `255.255.255.192` |
| Wildcard mask | `0.0.0.63` |
| Usable range | `192.168.10.1` to `192.168.10.62` |
| Total addresses | 64 |
| Usable hosts | 62 |

## Run locally

No build step is needed.

```bash
git clone https://github.com/victorkibetmutai/subnet-calculator.git
cd subnet-calculator
```

Then open `index.html` in any modern browser.

## Project structure

```
subnet-calculator/
├── index.html    # page layout
├── style.css     # styling and themes
├── subnet.js     # calculation logic (no DOM code)
└── script.js     # UI behavior and event handling
```

The calculation logic in `subnet.js` is kept separate from the interface code in `script.js`, which keeps it easy to read, test, and reuse.

## How subnetting works

An IPv4 address is 32 bits. The CIDR prefix (the number after the `/`) says how many of those bits identify the **network**; the remaining bits identify the **host**.

For `192.168.10.37/26`:

```
IP:      11000000.10101000.00001010.00100101
Mask:    11111111.11111111.11111111.11000000
Network: 11000000.10101000.00001010.00000000   (IP AND mask)  = 192.168.10.0
```

- **Network address** = IP AND mask
- **Broadcast address** = network address with all host bits set to 1
- **Usable hosts** = 2^(host bits) - 2 (except for `/31` and `/32`)
- **Wildcard mask** = the inverse of the subnet mask

## Tech

- HTML, CSS, and vanilla JavaScript
- No frameworks or external libraries
- Hosted on GitHub Pages

## Roadmap

- [ ] VLSM mode (split by required host counts)
- [ ] IPv6 support
- [ ] Range-to-CIDR conversion
- [ ] Supernetting / route summarization
- [ ] Unit tests and a GitHub Actions workflow

## Author

Built by [victorkibetmutai](https://github.com/victorkibetmutai).

## License

Released under the [MIT License](LICENSE).
