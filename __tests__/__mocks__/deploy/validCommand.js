module.exports = {
    data: {
        toJSON: () => ({ name: 'validCommand' }),
    },
    async execute() {
        return null;
    },
};