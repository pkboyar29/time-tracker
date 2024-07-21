interface Session {
   id: string,
   totalTimeSeconds: number,
   spentTimeSeconds: number,
   activity?: string,
   completed: boolean
}