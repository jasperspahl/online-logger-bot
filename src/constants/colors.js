module.exports = {
    bg: '#36393f',
    fg: '#dcddde',
    red: '#cc241d',
    yellow: '#fabd2f',
    green: '#689d6a',
    gray: '#928374',
    getStatusColor: function (id) {
        switch (id) {
            case 1:
                return this.green;
            case 2:
                return this.yellow;
            case 4:
                return this.red;
            case 3:
            default:
                return this.bg;
        }
    },
};