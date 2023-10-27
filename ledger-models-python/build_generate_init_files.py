import os
from pathlib import Path

root = './fintekkers'
paths = os.listdir(root)

ignore_folders = [
        "{}/{}".format(root,'.DS_Store'),
        "{}/{}".format(root,'__pycache__'),
        "{}/{}".format(root,'fintekkers_ledger_models.egg-info'),
    ]

def create_init_files(root:str):
    paths = os.listdir(root)
    for path in paths:
        path = "{}/{}".format(root,path)

        if os.path.isdir(path) and path not in ignore_folders:
        # if p.is_dir():# and p.__str__ not in ignore_folders:
            init_file = "{}/__init__.py".format(path)
            if not os.path.exists(init_file):
                f= open(init_file,"w+") 
                f.flush()
                f.close()
                print("Created {}".format(init_file))

            create_init_files(path)
        elif path in ignore_folders:
            print("Ignoring folder as its in the ignore list: {}".format(path))
        # elif os.path.isdir(path):
        #     print("Folder already has an init file")


create_init_files(root)