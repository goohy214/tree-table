import { Table } from "antd";
import { Key } from "antd/lib/table/interface";
import { useEffect, useState } from "react";
import axios from "axios";
import { isEmpty } from "lodash";

const column = [
  {
    title: "id",
    dataIndex: "id",
  },
  {
    title: "name",
    dataIndex: "name",
  },
];

const addParentId = (data: Record<string, any>[], parent: string | null) => {
  return data.map((el) => {
    el.parentId = parent;
    return el;
  });
};

const Index = () => {
  // initial expandedRowKeys should be undefined instead of [], otherwise we will have [undefined]
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>();
  const [data, setData] = useState<Record<string, any>[]>([]);
  const [tree, setTree] = useState<Record<string, any>[]>([]);
  const [mapping, setMapping] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isEmpty(data)) fetchData("level0", null);
  }, []);

  const handleOnExpandedRowsChange = (keys: readonly Key[]) => {
    setExpandedRowKeys([...(keys as any as string[])]);
  };

  const handleOnExpand = (
    expanded: boolean,
    record: Record<string, string>
  ) => {
    if (expanded) {
      fetchData(record.level, record.id);
    }
  };

  const fetchData = async (level: string, parentId: string | null) => {
    try {
      const res = await axios.get(`http://localhost:3001/api/tree/${level}`);
      const { data } = await res;
      constructTree(addParentId(data, parentId));
    } catch (err) {
      console.log(err);
    }
  };

  const constructTree = (newData: Record<string, any>[]) => {
    // update rawData
    const sData = [...data, ...newData];
    setData(sData);

    // update mapping
    const idMapping = sData.reduce((acc, el, i) => {
      acc[el.id] = i;
      return acc;
    }, {} as Record<string, number>);
    const sMapping = Object.assign(idMapping, mapping);
    setMapping(sMapping);

    // update tree
    // root is refer to an object in the sData array
    // using something like linkedList
    let root: { children: any } = { children: [] };
    sData.forEach((el) => {
      if (el.expandable) el.children = [];
      if (isEmpty(el.parentId)) {
        root.children = [...root.children, el];
        return;
      }
      const parentEl = sData[sMapping[el.parentId]];
      parentEl.children = [...(parentEl?.children || []), el];
    });
    setTree(root.children);
  };

  return (
    <Table
      // set rowKey to allow expandedRowKeys see id as keys
      rowKey="id"
      columns={column}
      dataSource={tree || []}
      expandable={{
        expandedRowKeys,
        onExpandedRowsChange: handleOnExpandedRowsChange,
        onExpand: handleOnExpand,
        rowExpandable: (record: Record<string, any>) => record.expandable,
      }}
    />
  );
};

export default Index;
