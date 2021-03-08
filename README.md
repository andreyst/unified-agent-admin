## Run
```
$ cd configs
$ docker rm -f ua; docker run -p 16241:16241 -it --uts=host --name=ua -v \/proc:/ua_proc -e PROC_DIRECTORY=/ua_proc -e FOLDER_ID=a1bs... -v "`pwd`/ua3.yml:/etc/yandex/unified_agent/conf.d/ua.yml"  cr.yandex/yc/unified-agent
```