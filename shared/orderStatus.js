export const ORDER_STATUSES = [
  "unconfirmed",
  "on_queue",
  "ongoing",
  "completed",
  "canceled",
]

export const ORDER_STATUS_LABELS = {
  unconfirmed: "Unconfirmed",
  on_queue: "On Queue",
  ongoing: "Ongoing",
  completed: "Completed",
  canceled: "Canceled",
}

export function isFinalStatus(status) {
  return status === "completed" || status === "canceled"
}
