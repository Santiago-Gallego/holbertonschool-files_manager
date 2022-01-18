#!/usr/bin/env bash
wget https://download.redis.io/releases/redis-6.2.4.tar.gz
tar xzf redis-6.2.4.tar.gz
cd redis-6.2.4
cd deps; make hiredis lua jemalloc linenoise
cd ..
make