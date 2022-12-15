cd data

python3 ../find_olds.py <<< "

"

sha1sum -c checksum.txt --status
if [[ $? -eq 1 ]]; then
    curl "https://wa.message.co.il/api/mandel346/send?phone=972526783413&token=6c21b14c08e4549644ef4afe514334fdbc1c34ee&text=new+laws+in+okneset!\n$(date +%d+%m)"
fi

sha1sum *.csv > checksum.txt