export function encodeEmailToNumber(email: string): bigint {
  if (!email || email.length === 0) {
    throw new Error('Email cannot be empty');
  }
  
  let result = BigInt(0);
  const base = BigInt(256);
  const maxUint256 = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF');
  
  for (let i = 0; i < email.length; i++) {
    const charCode = BigInt(email.charCodeAt(i));
    result = result * base + charCode;
    
    if (result > maxUint256) {
      throw new Error('Email too long to encode');
    }
  }
  
  return result;
}

export function decodeNumberToEmail(number: bigint): string {
  const base = BigInt(256);
  let result = '';
  let num = number;
  
  while (num > 0) {
    const charCode = Number(num % base);
    result = String.fromCharCode(charCode) + result;
    num = num / base;
  }
  
  return result;
}

