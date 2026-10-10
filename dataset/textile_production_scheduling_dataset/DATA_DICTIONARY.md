# Data Dictionary

## orders.csv
Order/batch IDs, customer segment, fabric type/composition, color family, GSM, width, required process, quantity in kg, priority, creation/deadline/material-availability timestamps, simulated material status, synthetic record marker.

## machines.csv
Machine ID/name/type, supported process/fabrics, batch capacity in kg, nominal rate kg/hour, efficiency/availability percentages, setup baseline, snapshot status and supported GSM range.

## production_history.csv
One simulated completed operation per order. Contains order/batch/machine IDs, textile attributes, quantity, machine characteristics, queue wait, planned/actual start/end, planned/actual processing minutes, setup, downtime, idle-after-job estimate, output, completion, defects/rework, shift and deadline outcome.

## allocation_candidates.csv
One row per order and candidate machine for the order's process. Contains candidate eligibility, machine features, estimated setup/queue/processing time, synthetic heuristic score and selected-machine label. Selected-machine labels are simulator-generated, not ground-truth optimal decisions.

## machine_availability_calendar.csv
Machine, date, shift, shift start, scheduled hours, availability status, maintenance duration and synthetic marker.
