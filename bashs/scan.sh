#/bin/bash
for i in 100 .. 110;do
	alive = `sudo nmap -sS -O -p 8765 192.168.10.$i |grep 8765`
done
