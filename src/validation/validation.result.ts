import { ValidationError } from './validation.error';

export class ValidationResult {
    constructor (public readonly errors: ValidationError[] = []) {}

    public getErrorForField(field: string): ValidationError | undefined {
        return this.errors.find(error => error.field === field);
    }

    public addError(href: string, text: string) {
        this.errors.push(new ValidationError(href, text));
    }

    public get hasErrors() {
        return this.errors.length > 0;
    }
}
