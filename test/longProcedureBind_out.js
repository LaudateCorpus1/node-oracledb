/* Copyright (c) 2017, 2021, Oracle and/or its affiliates. All rights reserved. */

/******************************************************************************
 *
 * You may not use the identified files except in compliance with the Apache
 * License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * The node-oracledb test suite uses 'mocha', 'should' and 'async'.
 * See LICENSE.md for relevant licenses.
 *
 * NAME
 *   130. longProcedureBind_out.js
 *
 * DESCRIPTION
 *    Test LONG type PLSQL procedure support.
 *    Long column restrictions: http://docs.oracle.com/cd/B19306_01/server.102/b14200/sql_elements001.htm#SQLRF00201
 *
 *****************************************************************************/
'use strict';

const oracledb = require('oracledb');
const assert   = require('assert');
const dbConfig = require('./dbconfig.js');
const random   = require('./random.js');
const sql      = require('./sqlClone.js');

describe('130. longProcedureBind_out.js', function() {

  var connection = null;
  var tableName = "nodb_long_130";
  var insertID = 0;
  var table_create = "BEGIN \n" +
                     "    DECLARE \n" +
                     "        e_table_missing EXCEPTION; \n" +
                     "        PRAGMA EXCEPTION_INIT(e_table_missing, -00942); \n" +
                     "    BEGIN \n" +
                     "        EXECUTE IMMEDIATE('DROP TABLE " + tableName + " PURGE'); \n" +
                     "    EXCEPTION \n" +
                     "        WHEN e_table_missing \n" +
                     "        THEN NULL; \n" +
                     "    END; \n" +
                     "    EXECUTE IMMEDIATE (' \n" +
                     "        CREATE TABLE " + tableName + " ( \n" +
                     "            id         NUMBER, \n" +
                     "            content    LONG \n" +
                     "        ) \n" +
                     "    '); \n" +
                     "END; ";
  var table_drop = "DROP TABLE " + tableName + " PURGE";

  before(async function() {
    try {
      connection = await oracledb.getConnection(dbConfig);
      await sql.executeSql(connection, table_create, {}, {});
    } catch (err) {
      assert.ifError(err);
    }
  }); // before

  after(async function() {
    try {
      await sql.executeSql(connection, table_drop, {}, {});
      await connection.release();
    } catch (err) {
      assert.ifError(err);
    }

  }); // after

  beforeEach(function() {
    insertID++;
  });

  describe('130.1 PLSQL PROCEDURE BIND OUT AS LONG', function() {
    var proc_bindout_name = "nodb_long_bindout_proc_1";
    var proc_bindout_create = "CREATE OR REPLACE PROCEDURE " + proc_bindout_name + " (num IN NUMBER, C OUT LONG) \n" +
                              "AS \n" +
                              "BEGIN \n" +
                              "    select content into C from " + tableName + " where num = ID; \n" +
                              "END " + proc_bindout_name + ";";
    var proc_bindout_exec = "BEGIN " + proc_bindout_name + " (:i, :c); END;";
    var proc_bindout_drop = "DROP PROCEDURE " + proc_bindout_name;

    before(async function() {
      try {
        await sql.executeSql(connection, proc_bindout_create, {}, {});
      } catch (err) {
        assert.ifError(err);
      }
    });

    after(async function() {
      try {
        await sql.executeSql(connection, proc_bindout_drop, {}, {});
      } catch (err) {
        assert.ifError(err);
      }

    });

    it('130.1.1 works with NULL', async function() {
      await long_bindout(null, proc_bindout_exec, 10);
    });

    it('130.1.2 works with undefined', async function() {
      await long_bindout(undefined, proc_bindout_exec, 10);
    });

    it('130.1.3 works with empty string', async function() {
      await long_bindout("", proc_bindout_exec, 10);
    });

    it('130.1.4 works with data size 4000', async function() {
      await long_bindout(random.getRandomLengthString(4000), proc_bindout_exec, 4000);
    });

    it('130.1.5 works with data size (32K - 1)', async function() {
      await long_bindout(random.getRandomLengthString(32767), proc_bindout_exec, 32767);
    });

    it('130.1.6 set maxSize to size (32K - 1)', async function() {
      await long_bindout(random.getRandomLengthString(100), proc_bindout_exec, 32767);
    });

    it('130.1.7 set maxSize to size 1GB', async function() {
      const maxsize = 1 * 1024 * 1024 * 1024;
      await long_bindout(random.getRandomLengthString(100), proc_bindout_exec, maxsize);
    });

  }); // 130.1

  describe('130.2 PLSQL PROCEDURE BIND OUT AS STRING', function() {
    var proc_bindout_name = "nodb_long_bindout_proc_2";
    var proc_bindout_create = "CREATE OR REPLACE PROCEDURE " + proc_bindout_name + " (num IN NUMBER, C OUT VARCHAR2) \n" +
                              "AS \n" +
                              "BEGIN \n" +
                              "    select content into C from " + tableName + " where num = ID; \n" +
                              "END " + proc_bindout_name + ";";
    var proc_bindout_exec = "BEGIN " + proc_bindout_name + " (:i, :c); END;";
    var proc_bindout_drop = "DROP PROCEDURE " + proc_bindout_name;

    before(async function() {
      try {
        await sql.executeSql(connection, proc_bindout_create, {}, {});
      } catch (err) {
        assert.ifError(err);
      }
    });

    after(async function() {
      try {
        await sql.executeSql(connection, proc_bindout_drop, {}, {});
      } catch (err) {
        assert.ifError(err);
      }
    });

    it('130.2.1 works with NULL', async function() {
      await long_bindout(null, proc_bindout_exec, 10);
    });

    it('130.2.2 works with undefined', async function() {
      await long_bindout(undefined, proc_bindout_exec, 10);
    });

    it('130.2.3 works with empty string', async function() {
      await long_bindout("", proc_bindout_exec, 10);
    });

    it('130.2.4 works with data size 4000', async function() {
      await long_bindout(random.getRandomLengthString(4000), proc_bindout_exec, 4000);
    });

    it('130.2.5 works with data size (32K - 1)', async function() {
      await long_bindout(random.getRandomLengthString(32767), proc_bindout_exec, 32767);
    });

    it('130.2.6 set maxSize to size (32K - 1)', async function() {
      await long_bindout(random.getRandomLengthString(100), proc_bindout_exec, 32767);
    });

    it('130.2.7 set maxSize to size 1GB', async function() {
      const maxsize = 1 * 1024 * 1024 * 1024;
      await long_bindout(random.getRandomLengthString(100), proc_bindout_exec, maxsize);
    });

  }); // 130.2

  var long_bindout = async function(insertContent, proc_bindin_exec, maxsize) {

    await insert(insertContent);
    const bind_in_var  = {
      i: { val: insertID, dir: oracledb.BIND_IN, type: oracledb.NUMBER },
      c: { type: oracledb.STRING, dir: oracledb.BIND_OUT, maxSize: maxsize }
    };
    const result = await connection.execute(proc_bindin_exec, bind_in_var);
    var expected = insertContent;
    if (insertContent == "" || insertContent == undefined) {
      expected = null;
    }
    assert.strictEqual(result.outBinds.c, expected);

  };

  var insert = async function(insertStr) {
    const result = await connection.execute(
      "insert into " + tableName + " values (:i, :c)",
      {
        i: { val: insertID, dir: oracledb.BIND_IN, type: oracledb.NUMBER },
        c: { val: insertStr, type: oracledb.STRING, dir: oracledb.BIND_IN }
      });

    assert(result);
    assert.strictEqual(result.rowsAffected, 1);
  };

});
