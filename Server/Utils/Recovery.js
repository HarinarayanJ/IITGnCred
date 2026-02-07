const bip39 = require('bip39');

const generateMnemonic = (inputString) => {
    // Convert input string to hex
    // Generate mnemonic from valid hex entropy
    const mnemonic = bip39.entropyToMnemonic(inputString.replace("0x", ""));
    console.log("Generated Mnemonic:", mnemonic, typeof mnemonic);
    return mnemonic;
};
const generateSeedFromMnemonic = (mnemonic) => {
    const seed = bip39.mnemonicToSeedSync(mnemonic).toString("hex");
    return seed;
}

module.exports = {
    generateMnemonic,
    generateSeedFromMnemonic
}