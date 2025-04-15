import { defineExtensionMessaging } from "@webext-core/messaging"

interface ProtocolMap {
  triggerReadyState(ready: boolean): void // No data and no return type
  triggerStart(): void
  triggerStop(): void
}

export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>()
