import PropTypes from 'prop-types';
import { DefaultButton } from '@fluentui/react/lib/Button';
import { mergeStyleSets } from '@fluentui/react/lib/Styling';
import { Stack } from '@fluentui/react';

const ChannelListItem = (props) => {
    const {
        title,
        description,
        id,
        image,
        onChannelSelected,
        // updatedAt,
    } = props;

    const classNames = mergeStyleSets({
        itemCell: {
            height: 104,
            width: '100%',
            padding: 0,
            textAlign: 'left',
            '& span': {
                justifyContent: 'left',
                alignItems: 'left',
            },
        },
        channelImage: {
            height: 100,
        },
        outerStack: {
            margin: 1,
            marginTop: 2,
            height: 102,
        },
        title: {
            fontWeight: 600,
            margin: 2,
        },
        description: {
            fontWeight: 400,
            margin: 2,
        },
    });

    return (
        <DefaultButton
            className={classNames.itemCell}
            onClick={() => onChannelSelected(id)}>
            <Stack
                className={classNames.outerStack}
                horizontal
                disableShrink={false}>
                <Stack.Item align='start'>
                    <img src={image} alt={title} className={classNames.channelImage} />
                </Stack.Item>
                <Stack
                    horizontal={false}
                    disableShrink={false}>
                    <Stack.Item align='auto'>
                        <p className={classNames.title}>{title}</p>
                    </Stack.Item>
                    <Stack.Item align='auto'>
                        <p className={classNames.description}>{description}</p>
                    </Stack.Item>
                </Stack>
            </Stack>
        </DefaultButton>
    )
};

ChannelListItem.propTypes = {
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    id: PropTypes.number.isRequired,
    image: PropTypes.string.isRequired,
    // updatedAt: PropTypes.string.isRequired,
    onChannelSelected: PropTypes.func.isRequired,
};

export { ChannelListItem }