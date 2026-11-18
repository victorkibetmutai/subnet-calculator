export function ipToInt(ip) {
  return ip.split('.').reduce((value, octet) => ((value * 256) + Number(octet)) >>> 0, 0);
}

export function intToIp(value) {
  return [value >>> 24, (value >>> 16) & 255, (value >>> 8) & 255, value & 255].join('.');
}

export function maskFor(bits) {
  return bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
}

export function parseIp(value) {
  if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(value)) throw new Error('Enter a valid IPv4 address.');
  if (value.split('.').map(Number).some(octet => octet > 255)) throw new Error('Each IPv4 octet must be between 0 and 255.');
  return ipToInt(value);
}

export function parseCidr(value) {
  const parts = value.trim().split('/');
  if (parts.length !== 2 || !parts[0] || !parts[1]) throw new Error('Enter an IPv4 address with a prefix, for example 10.0.0.1/24.');
  if (!/^\d+$/.test(parts[1]) || Number(parts[1]) > 32) throw new Error('Prefix length must be a number from 0 to 32.');
  const address = parseIp(parts[0]);
  const bits = Number(parts[1]);
  const mask = maskFor(bits);
  const network = (address & mask) >>> 0;
  const broadcast = (network | (~mask >>> 0)) >>> 0;
  const total = 2 ** (32 - bits);
  return { bits, mask, address, network, broadcast, first: bits >= 31 ? network : network + 1, last: bits >= 31 ? broadcast : broadcast - 1, total, hosts: bits >= 31 ? total : Math.max(0, total - 2) };
}

export function classifyIp(address) {
  const first = address >>> 24;
  const second = (address >>> 16) & 255;
  if (first === 10 || (first === 172 && second >= 16 && second <= 31) || (first === 192 && second === 168)) return 'Private';
  if (first === 127) return 'Loopback';
  if (first === 169 && second === 254) return 'Link-local';
  return 'Public';
}

export function usableRange(network, broadcast, bits) {
  return { first: bits >= 31 ? network : network + 1, last: bits >= 31 ? broadcast : broadcast - 1, hosts: bits >= 31 ? 2 ** (32 - bits) : Math.max(0, 2 ** (32 - bits) - 2) };
}

export function equalSubnets(cidr, newBits) {
  const size = 2 ** (32 - newBits);
  return Array.from({ length: Math.min(2 ** (newBits - cidr.bits), 4096) }, (_, index) => {
    const network = cidr.network + index * size;
    const broadcast = network + size - 1;
    return { network, broadcast, bits: newBits, ...usableRange(network, broadcast, newBits) };
  });
}

export function vlsmSubnets(cidr, requestedHosts) {
  const capacity = usableRange(cidr.network, cidr.broadcast, cidr.bits).hosts;
  if (requestedHosts.some(hosts => hosts > capacity)) throw new Error('A host count is larger than the selected network.');
  const rows = [];
  let cursor = cidr.network;
  for (const hosts of [...requestedHosts].sort((a, b) => b - a)) {
    const bits = Math.max(cidr.bits, 32 - Math.ceil(Math.log2(hosts + 2)));
    const size = 2 ** (32 - bits);
    const network = Math.ceil(cursor / size) * size;
    const broadcast = network + size - 1;
    if (network < cidr.network || broadcast > cidr.broadcast) throw new Error('These host counts do not fit inside the selected network.');
    rows.push({ network, broadcast, bits, ...usableRange(network, broadcast, bits), requested: hosts });
    cursor = broadcast + 1;
  }
  return rows.sort((a, b) => a.network - b.network);
}

export function binaryBits(value, networkBits) {
  return (value >>> 0).toString(2).padStart(32, '0').split('').map((bit, index) => ({ bit, network: index < networkBits }));
}

export function addressForms(value) {
  return { hex: `0x${(value >>> 0).toString(16).padStart(8, '0').toUpperCase()}`, integer: value >>> 0 };
}
