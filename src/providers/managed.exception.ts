export class ManagedException extends Error {
    constructor(
        public message: string,
        public notify: boolean = false
    ) {
        super(message);
        this.name = 'ManagedException';
    }
}
