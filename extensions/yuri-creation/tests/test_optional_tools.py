import base64
import json
from pathlib import Path
import struct
import tempfile
import unittest
import zlib
from test_creator import c


def chunk(kind, body):
    return struct.pack('>I', len(body)) + kind + body + struct.pack('>I', zlib.crc32(kind + body) & 0xffffffff)


class OptionalTools(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.card = self.root/'card.json'; self.avatar = self.root/'avatar.png'; self.out = self.root/'out.png'
        self.value = {'spec':'chara_card_v2','spec_version':'2.0','data':{'name':'阿澄','first_mes':'你好，{{user}}。'}}
        c.write(self.card, self.value)
        self.idat = zlib.compress(b'\0\0\0\0')
        self.raw = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR',struct.pack('>IIBBBBB',1,1,8,2,0,0,0)) + chunk(b'IDAT',self.idat) + chunk(b'IEND',b'')
        self.avatar.write_bytes(self.raw)

    def test_png_adapter_preserves_image_and_payloads(self):
        report = c.pack_image(self.card,self.avatar,self.out)
        chunks = list(c.serializer()._iter_chunks(self.out.read_bytes()))
        self.assertIn((b'IDAT',self.idat),chunks)
        payloads = {body.split(b'\0',1)[0]:json.loads(base64.b64decode(body.split(b'\0',1)[1])) for kind,body in chunks if kind==b'tEXt'}
        self.assertEqual(payloads[b'chara'],self.value)
        self.assertEqual(payloads[b'ccv3']['data']['source'],[])
        self.assertEqual(self.avatar.read_bytes(),self.raw)
        self.assertEqual(report['host_import'],'not_run')

    def test_bad_crc_and_existing_outputs_are_not_written_over(self):
        self.avatar.write_bytes(self.raw[:-1]+b'\x01')
        with self.assertRaisesRegex(ValueError,'CRC'):c.pack_image(self.card,self.avatar,self.out)
        self.assertFalse(self.out.exists())
        self.out.write_bytes(b'keep')
        with self.assertRaisesRegex(ValueError,'output exists'):c.pack_image(self.card,self.avatar,self.out)
        self.assertEqual(self.out.read_bytes(),b'keep')

    def test_compressed_card_metadata_is_rejected(self):
        self.avatar.write_bytes(self.raw[:-12]+chunk(b'zTXt',b'chara\0\0'+zlib.compress(b'old'))+self.raw[-12:])
        with self.assertRaisesRegex(ValueError,'separate decoder'):c.pack_image(self.card,self.avatar,self.out)
        self.assertFalse(self.out.exists())

    def test_capabilities_do_not_claim_native_tools(self):
        report=c.capabilities()
        self.assertEqual(report['host_registration'],'not_verified')
        self.assertEqual(report['authoring_dependency']['mode'],'standalone')
        self.assertIn('not_probed',report['research'])


if __name__=='__main__':unittest.main()
