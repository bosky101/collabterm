#/bin/bash
port=8765
for i in {100..110}
do
	ip=192.168.10.$i
	cmd="sudo nmap -v4 -sS -n -p $port $ip |grep $port"
	echo "Searching $ip for port $port, running cmd: $cmd"
	alive=`$cmd`
	echo "got alive as $alive"
	alivelen=${#alive}
	if [ $alivelen -ge 1]
	then
		echo $i is alive with $alive
	fi
done
