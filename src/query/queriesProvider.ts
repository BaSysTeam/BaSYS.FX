export interface IQueriesProvider {
    execute(model: any): Promise<any>;
}

declare global {
    var QueriesProvider: {
        new (): IQueriesProvider;
    };
    var DB_NAME: string;
}

