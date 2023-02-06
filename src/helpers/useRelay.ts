import { Filter, Relay, relayInit, Event } from "nostr-tools";
import { useState } from "react";
import { message_schema_compat } from "chia-signing-tools";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { sha256 } from "./sha256";

export const reputation_schema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("did_trust"),
    ts: z.string().datetime(),
    data: z.object({
      did: z.string().startsWith("did:chia:"),
    }),
  }),
]);

export const NOSTR_CHIA_MESSAGES = 8444;
const supabase = createClient(
  "https://umwdejvagxgtebmvyqvi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtd2RlanZhZ3hndGVibXZ5cXZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzU2MjM0NDEsImV4cCI6MTk5MTE5OTQ0MX0.k88jq5uVFvG9G75_LtI_pn6QaS8Xkxndb2kUPecxLvk"
);

export const useRelay = () => {
  const [relay, setRelay] = useState<Relay | undefined>();
  const [isConnected, setIsConnected] = useState<boolean>();

  if (!relay) {
    const relay = relayInit("wss://nostr.p2sh.co");
    setRelay(relay);
    relay.on("connect", () => {
      console.log(`connected to ${relay!.url}`);
      setIsConnected(true);
    });
    relay.on("error" as any, () => {
      console.log(`failed to connect to ${relay!.url}`);
      setIsConnected(false);
    });
    relay.on("disconnect" as any, () => {
      setIsConnected(false);
      console.log(`disconnect from ${relay!.url}`);
      relay?.connect();
    });
    relay.on("notice" as any, () => {
      console.log(`notice  from ${relay!.url}`);
    });
  }

  function subscribeToEvents(filter: Filter, callback: any) {
    if (!relay) {
      throw new Error("Relay not initialized");
    }
    const sub = relay.sub([filter]);
    sub.on("event", async (event: Event) => {
      try {
        console.log("event", event);
        const message = message_schema_compat.parse(JSON.parse(event.content));
        let innerMessage: string;
        if ("message" in message) {
          innerMessage = message?.message;
        } else {
          innerMessage = message?.msg;
        }
        const body = reputation_schema.parse(JSON.parse(innerMessage));
        // Check with service to see if it's valid
        const hash = await sha256(event.content);
        let valid: boolean | undefined = await isValid(hash);
        console.log(valid);
        if(valid === false) {
          return //callback(event);
        }
        return callback({...event, body: {...body, valid: valid}});
      } catch (e) {
        // Ignore
      }
      return //callback(event);
    });
    return sub;
  }

  function publish(event: Event) {
    return new Promise<void>((resolve, reject) => {
      if (!relay) {
        reject("Relay not initialized");
        return;
      }
      let pub = relay.publish(event);
      pub.on("ok", () => {
        console.log(`${relay!.url} has accepted our event`);
      });
      pub.on("seen", () => {
        console.log(`we saw the event on ${relay!.url}`);
        resolve();
      });
      pub.on("failed", (reason: any) => {
        console.log(`failed to publish to ${relay!.url}: ${reason}`);
        reject(reason);
      });
    });
  }

  async function isValid(hash: string) {
    try{
      const { data, error } = await supabase.from('checked_messages').select('*').eq('hash', hash).maybeSingle();
      if(data?.valid === false) {
        // Ignore if we know it's not valid
        return false;
      }
      return data?.valid;
    } catch (e) {
      // Ignore
    }
    return undefined;
  }

  return { isConnected, subscribeToEvents, publish, relay };
};
