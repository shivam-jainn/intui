'use client';

import { Button, CopyButton, Tooltip } from '@mantine/core';

export function ShareButton({ url }: { url: string }) {
  return (
    <CopyButton value={url} timeout={2000}>
      {({ copied, copy }) => (
        <Tooltip label={copied ? 'Copied' : 'Copy link to share'} withArrow position="right">
          <Button color={copied ? 'teal' : 'blue'} onClick={copy} mt="md" fullWidth>
            {copied ? 'Copied URL!' : 'Share Profile'}
          </Button>
        </Tooltip>
      )}
    </CopyButton>
  );
}
