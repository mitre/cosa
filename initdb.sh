#!/bin/bash
#
#   Copyright 2021 The MITRE Corporation
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.
mysql -uroot -p${MYSQL_ROOT_PASSWORD}  -e "CREATE database cosa;"

mysql -uroot -p${MYSQL_ROOT_PASSWORD}  -e "GRANT ALL PRIVILEGES ON *.* TO 'cosa'@'%' IDENTIFIED BY 'admin12345';FLUSH PRIVILEGES;" 
mysql -uroot -p${MYSQL_ROOT_PASSWORD} cosa < /tmp/dump.sql > /tmp/creation.log 2>&1
mysql -ucosa -p${MYSQL_ROOT_PASSWORD}  -e "set session sql_mode='STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION';"
mysql -ucosa -p${MYSQL_ROOT_PASSWORD}  -e "set global sql_mode='STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION';"

