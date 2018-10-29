export interface TagHandler {
    html(): Promise<string> | string;
    beforeend?(): Promise<string> | string; 
}