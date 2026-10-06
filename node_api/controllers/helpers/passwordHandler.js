const bcrypt = require('bcrypt');

const passPlainToHash = async (saltRounds,myPlaintextPassword) =>
{
    const salt = bcrypt.genSaltSync(saltRounds);
    const hash = bcrypt.hashSync(myPlaintextPassword, salt);
    return hash;
}

const verifyPassword = async (myPlaintextPassword,hashedPass) =>
{
   const result = bcrypt.compareSync(myPlaintextPassword, hashedPass);
   return result;
}

module.exports = {passPlainToHash, verifyPassword}