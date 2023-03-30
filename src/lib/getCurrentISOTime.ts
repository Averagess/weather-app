

const getCurrentISOTime = () => {
  const now = new Date();

  if (now.getMinutes() >= 30) {
    now.setHours(now.getHours() + 1);
    now.setMinutes(0);
  } else {
    now.setMinutes(0);
  }
  now.setSeconds(0);
  now.setMilliseconds(0);

  return now.toISOString().slice(0, -8);
};

export default getCurrentISOTime;