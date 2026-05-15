export const attackLogs = [];

export const addAttackLog = (
  ip,
  type
) => {

  attackLogs.unshift({
    id: Date.now(),
    ip,
    type,
    time: new Date().toLocaleTimeString(),
  });
};