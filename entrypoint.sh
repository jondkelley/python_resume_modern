#!/bin/bash
myresume &
until curl -sf -o /dev/null http://localhost:5001/; do sleep 1; done
/app/render.sh
wait
