-- Do not delete historical duplicates automatically: a failing upgrade must be investigated.
CREATE UNIQUE INDEX outbox_event_topic_unique ON outbox(event_id,topic);
