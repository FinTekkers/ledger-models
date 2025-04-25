export declare class ProtoEnum {
    private enumValue;
    private enumDescriptor;
    constructor(enumDescriptor: any, enumValue: number);
    static fromEnumName(enumName: string, enumValue: number): ProtoEnum;
    private static getFieldDescriptorFromName;
    getEnumDescriptor(): string;
    getEnumName(): Error;
    getEnumValue(): number;
    getEnumValueName(): string;
    toString(): string;
}
