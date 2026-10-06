
export const generateRandomStr = (length = 14) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;

    const randomValues = new Uint32Array(length);
    crypto.getRandomValues(randomValues); // global, no import — Node 19+ / all browsers

    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(randomValues[i] % charactersLength);
    }
    return result;
};

export const generateUsername = (parent, helpers) =>
{
    return parent.firstname.toLowerCase() + '-' + parent.lastname.toLowerCase();
};
