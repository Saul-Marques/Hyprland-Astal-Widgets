import { Binding } from "astal";
import { DateTime } from "luxon";

export function time(format) {
  const b = new Binding("");
  const update = () => {
    b.value = format(DateTime.local());
  };
  update();
  setInterval(update, 1000);
  return b;
}
